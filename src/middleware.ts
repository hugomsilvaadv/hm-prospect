import { NextRequest, NextResponse } from 'next/server';
export function middleware(request:NextRequest){
 const pathname=request.nextUrl.pathname;
 if(pathname.startsWith('/api/webhook')||pathname.startsWith('/login'))return NextResponse.next();
 const token=process.env.APP_ADMIN_TOKEN||'';
 const cookie=request.cookies.get('hm_auth')?.value||'';
 if(token.length<24||cookie!==token)return NextResponse.redirect(new URL('/login',request.url));
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
