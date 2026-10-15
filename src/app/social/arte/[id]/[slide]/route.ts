import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import { validAdminSession } from '@/lib/admin-session';
import { getSocialPost } from '@/features/social/store';
import { renderSocialSvg, slideCount } from '@/features/social/artwork';
import { requireApprovedForPublishing } from '@/features/social/policy';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest,context:{params:Promise<{id:string;slide:string}>}){
 const permitted=await validAdminSession((await cookies()).get('hm_auth')?.value||null,process.env.APP_ADMIN_TOKEN);
 if(!permitted)return new NextResponse('Acesso não autorizado.',{status:401});
 const {id,slide}=await context.params;
 if(!/^[1-9][0-9]*$/.test(id)||!/^[1-9][0-9]*$/.test(slide))return new NextResponse('Identificador inválido.',{status:400});
 const n=Number(id), s=Number(slide);
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(s))return new NextResponse('Identificador inválido.',{status:400});
 let post;
 try {post=getSocialPost(n);}
 catch{return new NextResponse('Conteúdo não encontrado.',{status:404});}
 if(s>slideCount(post))return new NextResponse('Slide não encontrado.',{status:404});
 const download=request.nextUrl.searchParams.get('download')==='1';
 let approved=false;
 try {requireApprovedForPublishing(post.status,post.approvedFingerprint,post);approved=true;}
 catch {/* No download without current exact fingerprint. */}
 if(download&&!approved)return new NextResponse('Aprove o conteúdo antes de exportar sem marca d’água.',{status:403});
 const svg=renderSocialSvg(approved?post:{...post,status:'draft'},s);
 const png=await sharp(Buffer.from(svg)).png().toBuffer();
 return new NextResponse(new Uint8Array(png),{
  headers:{'Content-Type':'image/png','Cache-Control':'private, no-store, max-age=0',
   'X-Content-Type-Options':'nosniff',
   'Content-Disposition':download?'attachment; filename="ekpria-'+n+'-slide-'+s+'.png"':'inline'}
 });
}
