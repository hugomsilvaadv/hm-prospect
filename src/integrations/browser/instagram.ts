import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from 'playwright';
import { normalizeHandle } from '@/lib/rules';

/** Connects only to the operator's existing, locally bound Chrome session. */
export async function withInstagramPage<T>(jobId: number, operation: (page: Page)=>Promise<T>): Promise<T> {
 const endpoint=process.env.CHROME_CDP_URL||'http://127.0.0.1:9222';
 const parsed=new URL(endpoint);
 if (!['127.0.0.1','localhost'].includes(parsed.hostname)) throw new Error('CDP_MUST_BE_LOCALHOST');
 const browser=await chromium.connectOverCDP(endpoint);
 const context=browser.contexts()[0];
 if (!context) { await browser.close(); throw new Error('BROWSER_SESSION_MISSING'); }
 const page=await context.newPage();
 const failures:string[]=[];
 page.on('console',msg=>{if(msg.type()==='error') failures.push('console:'+msg.text().slice(0,400));});
 page.on('requestfailed',r=>failures.push('network:'+r.url().slice(0,150)));
 try { return await operation(page); }
 catch(e){
   fs.mkdirSync(path.resolve('screenshots'),{recursive:true});
   await page.screenshot({path:path.resolve('screenshots',jobId+'.png')}).catch(()=>undefined);
   const snapshot=await page.locator('body').innerText({timeout:2000}).catch(()=>'unavailable');
   fs.writeFileSync(path.resolve('screenshots',jobId+'.json'),JSON.stringify({
     jobId,url:page.url(),snapshot:snapshot.slice(0,12000),failures,error:String(e)
   },null,2));
   throw e;
 } finally { await page.close().catch(()=>undefined); await browser.close().catch(()=>undefined); }
}

export async function discoverProfiles(keyword: string, jobId: number): Promise<{handle:string; displayName:string}[]> {
 return withInstagramPage(jobId,async page=>{
   await page.goto('https://www.instagram.com/',{waitUntil:'domcontentloaded'});
   const search=page.getByRole('link',{name:/Pesquisar|Search/i}).first();
   await search.click({timeout:9000});
   const input=page.getByPlaceholder(/Pesquisar|Search/i).first();
   await input.fill(keyword,{timeout:9000});
   await page.waitForTimeout(1800);
   const rows=await page.locator('a[href^="/"]').evaluateAll(nodes=>nodes.map(node=>({
     href:node.getAttribute('href')||'',label:(node.textContent||'').trim()
   })).slice(0,80));
   const blocked=new Set(['explore','reels','stories','direct','accounts','about','legal']);
   const unique=new Map<string,{handle:string;displayName:string}>();
   for(const row of rows){
     const match=/^\/([a-zA-Z0-9._]+)\/?$/.exec(row.href);
     if(!match)continue;
     const handle=normalizeHandle(match[1]);
     if(!handle||blocked.has(handle))continue;
     unique.set(handle,{handle,displayName:row.label.slice(0,100)});
   }
   return [...unique.values()];
 });
}

export async function sendFirstDm(handle: string, body: string, jobId: number): Promise<'sent'|'dry_run'> {
 return withInstagramPage(jobId,async page=>{
   await page.goto('https://www.instagram.com/'+encodeURIComponent(normalizeHandle(handle))+'/',{waitUntil:'domcontentloaded'});
   const message=page.getByRole('button',{name:/Mensagem|Message/i}).first();
   await message.click({timeout:12000});
   const editor=page.getByRole('textbox',{name:/Mensagem|Message/i}).first();
   await editor.waitFor({timeout:12000});
   if(process.env.LIVE_SEND_ENABLED!=='true') return 'dry_run';
   await editor.fill(body);
   await page.waitForTimeout(500);
   await editor.press('Enter');
   return 'sent';
 });
}
