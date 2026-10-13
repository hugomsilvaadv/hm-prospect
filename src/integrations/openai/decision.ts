import OpenAI from 'openai';
import { sqlite } from '@/db/client';
import { getBusiness } from '@/lib/business';

export type Decision = { intention: string; action: 'reply'|'wait'|'handoff'|'close'|'human'; message: string };
export async function decideMessage(leadId:number, bio:string, history:string[], isFirst:boolean):Promise<Decision>{
 const business=getBusiness();
 const spent=sqlite.prepare("SELECT COALESCE(SUM(estimated_cost_usd),0) AS total FROM ai_calls WHERE created_at>=?")
 .get(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1)) as {total:number};
 const budget=Number(process.env.OPENAI_MONTHLY_BUDGET_USD||0);
 if(!budget||spent.total>=budget)throw new Error('OPENAI_BUDGET_EXHAUSTED');
 if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_KEY_MISSING');
 const model=(isFirst?process.env.OPENAI_MODEL_FAST:process.env.OPENAI_MODEL)||'gpt-4.1-mini';
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
 const prompt=[
  'You are an ethical and truthful B2B prospecting assistant. Return ONLY compact JSON.',
  'Valid action: reply, wait, handoff, close, human.',
  'Valid intention: interested, asked_info, asked_pricing, wants_whatsapp, not_the_owner, will_forward, objection, not_interested, opt_out, ambiguous, needs_human.',
  'Never use any claims other than the exact verified claims. Do not invent pricing, success rates, results or relationships.',
  'If first approach: short, specific, relevant, professional. Do not pose as a customer.',
  'If opt out: action=close. If pricing unverified: action=human.',
  'Business: '+business.companyName,
  'Service: '+business.oneLinePitch,
  'Verified claims: '+JSON.stringify(business.verifiedClaims),
  'Lead public bio: '+bio.slice(0,1800),
  'History: '+JSON.stringify(history.slice(-20)),
  'First contact: '+isFirst,
  'Return {"intention":"ambiguous","action":"wait","message":""} or appropriate action.'
 ].join('\n');
 const result=await client.chat.completions.create({
  model,messages:[{role:'user',content:prompt}],response_format:{type:'json_object'},temperature:0.4
 });
 const raw=result.choices[0]?.message?.content||'{}';
 let data:Partial<Decision>={};
 try{data=JSON.parse(raw) as Partial<Decision>;}catch{data={action:'human',intention:'needs_human',message:''};}
 const input=result.usage?.prompt_tokens||0,output=result.usage?.completion_tokens||0;
 const unitIn=Number(process.env.OPENAI_INPUT_USD_PER_1M||0);
 const unitOut=Number(process.env.OPENAI_OUTPUT_USD_PER_1M||0);
 const cost=input*unitIn/1e6+output*unitOut/1e6;
 sqlite.prepare('INSERT INTO ai_calls(lead_id,model,prompt_tokens,completion_tokens,estimated_cost_usd,created_at) VALUES(?,?,?,?,?,?)')
 .run(leadId,model,input,output,cost,Date.now());
 return {
  intention: typeof data.intention==='string'?data.intention:'needs_human',
  action: ['reply','wait','handoff','close','human'].includes(data.action||'')?data.action!:'human',
  message:typeof data.message==='string'?data.message.slice(0,900):''
 };
}
