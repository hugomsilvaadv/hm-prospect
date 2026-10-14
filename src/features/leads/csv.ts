/** CSV data stays local; only business profile fields are imported. */
export type ProspectRow={
  handle:string;
  displayName:string;
  segment:string;
  bio:string;
  location:string;
  sourceUrl:string;
};
export type ProspectImport={leads:ProspectRow[]; invalidRows:number; repeatedRows:number; totalRows:number};

function key(value:string):string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
}
function handleFrom(value:string):string|null {
  const trimmed=value.trim();
  let name=trimmed.replace(/^@/,'');
  if(/^https?:\/\//i.test(trimmed)){
    try {
      const url=new URL(trimmed);
      if(!['instagram.com','www.instagram.com'].includes(url.hostname.toLowerCase()))return null;
      name=url.pathname.split('/').filter(Boolean)[0]||'';
    } catch{return null;}
  }
  return /^[a-z0-9._]{2,30}$/i.test(name)?name.toLowerCase():null;
}

function parseRows(input:string):string[][] {
  const header=input.slice(0,input.indexOf('\n')===-1?input.length:input.indexOf('\n'));
  const separator=(header.match(/;/g)||[]).length>(header.match(/,/g)||[]).length?';':',';
  const rows:string[][]=[];
  let row:string[]=[],cell='',quoted=false;
  for(let i=0;i<input.length;i++){
    const char=input[i];
    if(char==='"'){
      if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
    }else if(char===separator&&!quoted){row.push(cell);cell='';}
    else if((char==='\n'||char==='\r')&&!quoted){
      if(char==='\r'&&input[i+1]==='\n')i++;
      row.push(cell);cell='';
      if(row.some(c=>c.trim()!==''))rows.push(row);
      row=[];
    }else cell+=char;
  }
  if(quoted)throw new Error('CSV contém aspas não fechadas.');
  row.push(cell);
  if(row.some(c=>c.trim()!==''))rows.push(row);
  return rows;
}

export function parseProspectCsv(input:string):ProspectImport {
  if(Buffer.byteLength(input,'utf8')>256*1024)throw new Error('Arquivo excede 256 KB.');
  const rows=parseRows(input.replace(/^\uFEFF/,''));
  if(rows.length<2)throw new Error('Inclua cabeçalho e ao menos um perfil.');
  if(rows.length>251)throw new Error('Importe no máximo 250 linhas de cada vez.');
  const headers=rows[0].map(key);
  function col(...aliases:string[]):number { return headers.findIndex(h=>aliases.some(a=>key(a)===h)); }
  const h=col('instagram','handle','usuario','perfil','arroba');
  if(h<0)throw new Error('Falta a coluna instagram ou handle.');
  const n=col('nome','display_name','name','empresa');
  const s=col('segmento','segment','setor');
  const b=col('bio','biografia','descricao');
  const l=col('cidade','location','localizacao','regiao');
  const u=col('fonte','source_url','url_fonte','origem_url');
  const seen=new Set<string>();
  const leads:ProspectRow[]=[];
  let invalidRows=0,repeatedRows=0;
  for(const row of rows.slice(1)){
    const value=(idx:number):string=>idx>=0?(row[idx]||'').trim():'';
    const handle=handleFrom(value(h));
    if(!handle||handle==='ekpria'){invalidRows++;continue;}
    if(seen.has(handle)){repeatedRows++;continue;}
    seen.add(handle);
    const sourceUrl=value(u).slice(0,500);
    if(sourceUrl&&!/^https?:\/\//i.test(sourceUrl)){invalidRows++;continue;}
    leads.push({
      handle,displayName:value(n).slice(0,120),segment:value(s).slice(0,100),
      bio:value(b).slice(0,1800),location:value(l).slice(0,120),
      sourceUrl
    });
  }
  return {leads,invalidRows,repeatedRows,totalRows:rows.length-1};
}
