/**
 * Commercial fit, never a prediction of delinquency, cash flow or business health.
 * Only disclosed professional profile text and operator-provided categorization are used.
 */
export type QualificationInput = {
  segment?: string;
  bio?: string;
  location?: string;
  keywords?: string[];
  targetLocations?: string[];
};

export type Qualification = { score: number; reasons: string[]; priority: 'high'|'medium'|'low' };

function fold(value:string):string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
}

export function qualifyCompany(input:QualificationInput):Qualification {
  const content = fold([input.segment,input.bio].filter(Boolean).join(' '));
  const location = fold(input.location||'');
  const reasons:string[]=[];
  let score=0;
  const segments=[
    {needles:['distribuidora','distribuicao','atacadista','atacado'], points:35, reason:'Distribuição ou atacado'},
    {needles:['fornecedor','insumos','autopecas','materiais de construcao','industria'], points:30, reason:'Fornecedor de produtos ou insumos B2B'},
    {needles:['prestadora de servicos','servicos empresariais','terceirizacao','facilities'], points:25, reason:'Serviços empresariais recorrentes'},
  ];
  const match=segments.find(s=>s.needles.some(needle=>content.includes(needle)));
  if(match){score+=match.points;reasons.push(match.reason);}
  const keywords=[...new Set((input.keywords||[]).map(fold).filter(x=>x.length>=4))];
  const hits=keywords.filter(word=>content.includes(word)).slice(0,3);
  if(hits.length){score+=Math.min(25,hits.length*10);reasons.push('Termos alinhados ao público: '+hits.join(', '));}
  if(['empresa','b2b','cnpj','corporativo','faturamento','clientes empresariais'].some(word=>content.includes(word))){
    score+=15;reasons.push('Identidade empresarial identificável');
  }
  const areas=(input.targetLocations||[]).map(fold);
  if(location&&areas.some(target=>location.includes(target)||target.includes(location))){
    score+=20;reasons.push('Região prioritária');
  }
  score=Math.min(100,score);
  return {score,reasons,priority:score>=70?'high':score>=40?'medium':'low'};
}
