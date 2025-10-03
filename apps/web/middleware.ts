import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/', // Landing page
    '/login',
    '/signup',
    '/reset-password',
    '/terms-of-service',
    '/privacy-policy',
    '/verify', // Trust seal verification
    '/test-admin' // Test admin page for development
  ];

  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return req.nextUrl.pathname === '/';
    }
    return req.nextUrl.pathname.startsWith(route);
  });

  // If user is not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access landing page, redirect to dashboard
  if (session && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (session && ['/login', '/signup', '/reset-password'].some(route => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};