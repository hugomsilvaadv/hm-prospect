import OpenAI from 'openai';
import { sqlite } from '@/db/client';
import { asFormat, bounded, requireContent, type SocialContent } from './policy';

// A geração é acionada SOMENTE por clique autenticado; não há agendamento ou loop automático.
export async function generateSocialContent(topicInput:string,formatInput:string):Promise<SocialContent>{
 const topic=bounded(topicInput,300);
 if(topic.length<6)throw new Error('Informe um assunto mais detalhado.');
 if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY não configurada. Use os rascunhos manuais.');
 const format=asFormat(formatInput);
 const model=process.env.SOCIAL_AI_MODEL||process.env.OPENAI_MODEL_FAST||'gpt-4.1-mini';
 const month=new Date();month.setUTCDate(1);month.setUTCHours(0,0,0,0);
 const total=sqlite.prepare('SELECT COUNT(*) AS n FROM social_ai_usage WHERE created_at>=?').get(month.getTime()) as {n:number};
 // Proteção inicial simples de volume; orçamento financeiro deve ser implementado antes de escala.
 const limit=Math.min(100,Math.max(1,Number(process.env.SOCIAL_AI_MONTHLY_LIMIT||30)||30));
 if(total.n>=limit)throw new Error('Limite mensal de conteúdos com IA atingido.');
 const ai=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:25000,maxRetries:1});
 const output=await ai.chat.completions.create({
  model,temperature:0.6,max_completion_tokens:1300,
  response_format:{type:'json_object'},
  messages:[
   {role:'system',content:'Você é estrategista de conteúdo da EKPRIA, uma marca brasileira de cobrança administrativa e recuperação de recebíveis B2B. Público: empresários, distribuidores, atacadistas e gestores financeiros. Escreva em português do Brasil, em tom objetivo e didático. Não invente números, clientes, resultados, depoimentos, estatísticas, contratos ou credenciais. Não faça promessas de êxito, nem aconselhamento jurídico individual. Não solicite dados de devedores. Responda exclusivamente com um objeto JSON com as chaves title, topic, hook, caption, visualBrief, hashtags. Legenda de até 1800 caracteres. Inclua CTA respeitoso e de três a seis hashtags. visualBrief deve ser apenas instrução textual para futura criação de arte.'},
   {role:'user',content:JSON.stringify({topic,format})}
  ]
 });
 const raw=output.choices[0]?.message?.content;
 if(!raw)throw new Error('O modelo não retornou conteúdo.');
 let parsed:Record<string,unknown>;
 try { parsed=JSON.parse(raw) as Record<string,unknown>; }
 catch { throw new Error('Resposta da IA fora do padrão JSON esperado.'); }
 const c:SocialContent={
  title:bounded(parsed.title,140),format,topic:bounded(parsed.topic||topic,300),
  hook:bounded(parsed.hook,500),caption:bounded(parsed.caption,2200),
  visualBrief:bounded(parsed.visualBrief,1500),hashtags:bounded(parsed.hashtags,500),scheduledAt:null
 };
 requireContent(c);
 sqlite.prepare('INSERT INTO social_ai_usage(model,prompt_tokens,completion_tokens,created_at) VALUES(?,?,?,?)')
  .run(model,output.usage?.prompt_tokens||0,output.usage?.completion_tokens||0,Date.now());
 return c;
}
