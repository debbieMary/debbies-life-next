import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get('debbies-session')?.value;

  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!login|api/auth|_next|favicon).*)'],
};
