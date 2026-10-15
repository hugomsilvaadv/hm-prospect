import type { SocialPost } from './store';

// Deterministic original brand templates: no image-generation service or third-party asset required.
const palette = { navy:'#07141f', navy2:'#112a34', mint:'#5ed2ae', cream:'#f5f1e8', subtle:'#a1b8bd' };
const escapeXml = (s:string):string => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
function lines(value:string, maxChars:number, maxLines:number):string[] {
 const words=value.replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').trim().split(' ');
 const result:string[]=[]; let current='';
 for(const word of words){
  if((current+' '+word).trim().length>maxChars && current){result.push(current);current='';}
  current=(current+' '+word).trim();
  if(result.length===maxLines)break;
 }
 if(current && result.length<maxLines)result.push(current);
 if(result.length===maxLines && words.join(' ').length>result.join(' ').length)
  result[maxLines-1]=result[maxLines-1].replace(/[.,;:]?$/,'…');
 return result;
}
function textLines(value:string, x:number, y:number, size:number, maxChars:number, maxLines:number, color:string, height:number):string {
 return lines(value,maxChars,maxLines).map((line,i)=>'<text x="'+x+'" y="'+(y+i*height)+'" font-family="Arial,Helvetica,sans-serif" font-size="'+size+'" font-weight="700" fill="'+color+'">'+escapeXml(line)+'</text>').join('');
}
function paragraphText(value:string):string {
 const text=value.replace(/[#*_]+/g,'').replace(/https?:\/\/\S+/g,'').trim();
 return text.slice(0,400);
}
export function slideCount(post:SocialPost):number {return post.format==='carrossel'?4:1;}
export function renderSocialSvg(post:SocialPost, slide:number):string {
 const total=slideCount(post);
 if(!Number.isInteger(slide)||slide<1||slide>total)throw new Error('Slide inválido.');
 const tall=post.format==='story'||post.format==='reel', w=1080,h=tall?1920:1350;
 const title=post.hook||post.title;
 const summary=paragraphText(post.caption);
 let main='';
 if(slide===1){
  main=textLines(title,82,tall?730:520,79,22,5,palette.cream,104)+
    textLines(post.topic,84,tall?1330:1080,31,54,3,palette.subtle,46);
 }else if(slide===2){
  main=textLines('O QUE IMPORTA',82,385,72,22,2,palette.cream,100)+
    textLines(summary,82,590,39,41,11,palette.cream,60);
 }else if(slide===3){
  main=textLines('CONSTRUÇÃO DE RESULTADOS',82,380,61,26,3,palette.cream,87)+
    textLines(post.visualBrief||summary,82,665,36,45,10,palette.cream,61);
 }else {
  main=textLines('GESTÃO DE RECEBÍVEIS',82,505,75,23,3,palette.cream,110)+
   textLines('Converse com a equipe EKPRIA.',82,970,38,40,2,palette.subtle,56);
 }
 const number=total>1?String(slide).padStart(2,'0')+' / '+String(total).padStart(2,'0'):'';
 const watermark=post.status==='approved'?'':'<g transform="translate(280 '+(h-125)+') rotate(-7)"><rect width="520" height="52" rx="6" fill="#eab467" opacity=".95"/><text x="24" y="36" fill="#18242c" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="700">RASCUNHO - REVISÃO PENDENTE</text></g>';
 return [
  '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">',
  '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+palette.navy+'"/><stop offset="1" stop-color="'+palette.navy2+'"/></linearGradient></defs>',
  '<rect width="'+w+'" height="'+h+'" fill="url(#bg)"/>',
  '<circle cx="1110" cy="0" r="450" fill="'+palette.mint+'" opacity=".07"/>',
  '<path d="M80 128 H1000" stroke="'+palette.mint+'" stroke-width="5"/>',
  '<rect x="82" y="178" width="64" height="11" rx="5" fill="'+palette.mint+'"/>',
  '<text x="82" y="248" font-family="Arial,Helvetica,sans-serif" font-size="56" font-weight="800" letter-spacing="5" fill="'+palette.cream+'">EKPRIA</text>',
  '<text x="82" y="294" font-family="Arial,Helvetica,sans-serif" font-size="24" letter-spacing="4" fill="'+palette.mint+'">COBRANÇA E RECEBÍVEIS</text>',
  main,
  '<path d="M80 '+(h-160)+' H1000" stroke="#44766e" stroke-width="2"/>',
  '<text x="82" y="'+(h-96)+'" font-family="Arial,Helvetica,sans-serif" font-size="25" fill="'+palette.subtle+'">CONTEÚDO EKPRIA · GESTÃO FINANCEIRA</text>',
  '<text x="935" y="'+(h-96)+'" font-family="Arial,Helvetica,sans-serif" font-size="24" fill="'+palette.mint+'">'+number+'</text>',
  watermark,
  '</svg>'
 ].join('');
}
