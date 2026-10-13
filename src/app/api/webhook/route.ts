import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sqlite } from '@/db/client';
import { queueJob, logEvent } from '@/lib/jobs';

export const runtime='nodejs';
export async function GET(request:NextRequest) {
 const u=request.nextUrl.searchParams;
 const token=process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
 if(token&&u.get('hub.mode')==='subscribe'&&u.get('hub.verify_token')===token) {
   return new Response(u.get('hub.challenge')||'',{status:200});
 }
 return new Response('Invalid verification', {status:403});
}
export async function POST(request:NextRequest) {
 const secret=process.env.INSTAGRAM_APP_SECRET;
 if(!secret)return new Response('Webhook not configured',{status:503});
 const raw=await request.text();
 const signature=request.headers.get('x-hub-signature-256')||'';
 const digest='sha256='+createHmac('sha256',secret).update(raw).digest('hex');
 const a=Buffer.from(signature), b=Buffer.from(digest);
 if(a.length!==b.length||!timingSafeEqual(a,b))return new Response('Invalid signature',{status:403});
 let payload:unknown;
 try{payload=JSON.parse(raw);}catch{return new Response('Bad JSON',{status:400});}
 if(!payload||typeof payload!=='object')return NextResponse.json({ok:true});
 type Event={sender?:{id?:string};recipient?:{id?:string};message?:{mid?:string;text?:string;is_echo?:boolean};timestamp?:number};
 const entries=(payload as {entry?:Array<{messaging?:Event[]}>}).entry||[];
 for(const entry of entries)for(const event of entry.messaging||[]){
   const sender=event.sender?.id, mid=event.message?.mid, text=event.message?.text;
   if(!sender||!mid||!text||event.message?.is_echo)continue;
   const lead=sqlite.prepare('SELECT id,handle,opted_out FROM leads WHERE meta_user_id=?')
     .get(sender) as {id:number;handle:string;opted_out:number}|undefined;
   if(!lead) {logEvent('unmatched_inbound',null,{sender,mid});continue;}
   if(lead.opted_out)continue;
   const insert=sqlite.prepare('INSERT OR IGNORE INTO webhook_events(id,received_at) VALUES(?,?)').run(mid,Date.now());
   if(!insert.changes)continue;
   const now=Date.now();
   sqlite.transaction(()=>{
     sqlite.prepare('INSERT OR IGNORE INTO messages(lead_id,external_id,direction,channel,body,created_at) VALUES(?,?,?,?,?,?)')
       .run(lead.id,mid,'inbound','api',text,now);
     sqlite.prepare("UPDATE leads SET meta_user_id=?,inbound_at=?,channel='api_eligible',pipeline='replied',updated_at=? WHERE id=?")
       .run(sender,now,now,lead.id);
     queueJob('reply',lead.id,{messageId:mid});
     logEvent('inbound_reply',lead.id,{mid});
   })();
 }
 return NextResponse.json({ok:true});
}
