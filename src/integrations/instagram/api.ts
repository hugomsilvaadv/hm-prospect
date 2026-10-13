export async function sendInstagramApiMessage(recipientId: string, body: string): Promise<string> {
 const token=process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
 const igId=process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
 const version=process.env.INSTAGRAM_GRAPH_API_VERSION||'v23.0';
 if(!token||!igId)throw new Error('META_API_NOT_CONFIGURED');
 const response=await fetch('https://graph.instagram.com/'+version+'/'+encodeURIComponent(igId)+'/messages',{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({recipient:{id:recipientId},message:{text:body}})
 });
 if(!response.ok)throw new Error('META_API_ERROR_'+response.status);
 const payload=await response.json() as {message_id?:string};
 if(!payload.message_id)throw new Error('META_API_MISSING_MESSAGE_ID');
 return payload.message_id;
}
