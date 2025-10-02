import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import {
  getDomainConfig,
  detectBrowserLanguage,
  isLanguageSupportedForDomain,
  getCurrentLanguageFromPath,
  getLocalizedPath
} from '@/lib/i18n/domain-matrix';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost';

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/locales/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check authentication for route redirection
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect authenticated users from landing page to dashboard
  const pathWithoutLang = pathname.replace(/^\/[a-z]{2}/, '') || '/';
  if (session && pathWithoutLang === '/') {
    const targetLanguage = getCurrentLanguageFromPath(pathname) || getDomainConfig(hostname).primaryLanguage;
    const dashboardUrl = new URL(`/${targetLanguage}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  const domainConfig = getDomainConfig(hostname);
  const currentLangFromPath = getCurrentLanguageFromPath(pathname);

  // Determine target language
  let targetLanguage: string;

  if (currentLangFromPath && isLanguageSupportedForDomain(hostname, currentLangFromPath)) {
    // Valid language in path, continue
    targetLanguage = currentLangFromPath;
  } else {
    // No language in path or invalid language, detect appropriate language

    // 1. Check cookie
    const cookieLang = request.cookies.get('stronghold-lang')?.value;
    if (cookieLang && isLanguageSupportedForDomain(hostname, cookieLang)) {
      targetLanguage = cookieLang;
    } else {
      // 2. Check Accept-Language header
      const acceptLanguage = request.headers.get('accept-language');
      if (acceptLanguage) {
        const preferredLangs = acceptLanguage
          .split(',')
          .map(lang => lang.split(';')[0].split('-')[0].toLowerCase())
          .filter(lang => isLanguageSupportedForDomain(hostname, lang));

        targetLanguage = preferredLangs[0] || domainConfig.primaryLanguage;
      } else {
        // 3. Fallback to domain primary language
        targetLanguage = domainConfig.primaryLanguage;
      }
    }

    // Redirect to localized path if language was detected/changed
    if (!currentLangFromPath || currentLangFromPath !== targetLanguage) {
      const localizedPath = getLocalizedPath(pathname, targetLanguage, hostname);
      const redirectUrl = new URL(localizedPath + search, request.url);

      const response = NextResponse.redirect(redirectUrl);

      // Set language cookie
      response.cookies.set('stronghold-lang', targetLanguage, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
        domain: hostname.includes('localhost') ? undefined : `.${hostname}`
      });

      return response;
    }
  }

  // Add language header for server components
  const response = NextResponse.next();
  response.headers.set('x-stronghold-language', targetLanguage);
  response.headers.set('x-stronghold-hostname', hostname);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - locales (translation files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|locales).*)',
  ],
};