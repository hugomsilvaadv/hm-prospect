import { NextRequest, NextResponse } from 'next/server';
import { validAdminSession } from '@/lib/admin-session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/webhook') || pathname.startsWith('/login')) return NextResponse.next();
  const valid = await validAdminSession(request.cookies.get('hm_auth')?.value || null, process.env.APP_ADMIN_TOKEN);
  if (!valid) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
