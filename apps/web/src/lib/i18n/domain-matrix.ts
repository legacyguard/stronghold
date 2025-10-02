export interface DomainLanguageConfig {
  domain: string;
  primaryLanguage: string;
  supportedLanguages: string[];
  jurisdiction: string;
  fallbackLanguage: string;
  region: string;
}

export const DOMAIN_LANGUAGE_MATRIX: DomainLanguageConfig[] = [
  {
    domain: 'stronghold.sk',
    primaryLanguage: 'sk',
    supportedLanguages: ['sk', 'cs', 'en'],
    jurisdiction: 'SK',
    fallbackLanguage: 'en',
    region: 'EMEA'
  },
  {
    domain: 'stronghold.cz',
    primaryLanguage: 'cs',
    supportedLanguages: ['cs', 'sk', 'en'],
    jurisdiction: 'CZ',
    fallbackLanguage: 'en',
    region: 'EMEA'
  },
  {
    domain: 'stronghold.com',
    primaryLanguage: 'en',
    supportedLanguages: ['en', 'sk', 'cs'],
    jurisdiction: 'US',
    fallbackLanguage: 'en',
    region: 'AMERICAS'
  },
  {
    domain: 'localhost',
    primaryLanguage: 'sk',
    supportedLanguages: ['sk', 'cs', 'en'],
    jurisdiction: 'SK',
    fallbackLanguage: 'en',
    region: 'DEV'
  },
  {
    domain: 'localhost:3000',
    primaryLanguage: 'sk',
    supportedLanguages: ['sk', 'cs', 'en'],
    jurisdiction: 'SK',
    fallbackLanguage: 'en',
    region: 'DEV'
  },
  {
    domain: 'localhost:3001',
    primaryLanguage: 'sk',
    supportedLanguages: ['sk', 'cs', 'en'],
    jurisdiction: 'SK',
    fallbackLanguage: 'en',
    region: 'DEV'
  },
  {
    domain: 'vercel.app',
    primaryLanguage: 'sk',
    supportedLanguages: ['sk', 'cs', 'en'],
    jurisdiction: 'SK',
    fallbackLanguage: 'en',
    region: 'DEV'
  }
];

export function getDomainConfig(hostname: string): DomainLanguageConfig {
  // Handle Vercel deployment domains
  if (hostname.includes('vercel.app') || hostname.includes('stronghold-')) {
    return DOMAIN_LANGUAGE_MATRIX.find(config => config.domain === 'vercel.app')!;
  }

  // Find exact domain match
  const config = DOMAIN_LANGUAGE_MATRIX.find(config =>
    hostname === config.domain || hostname.endsWith(`.${config.domain}`)
  );

  // Return found config or default to .sk domain
  return config || DOMAIN_LANGUAGE_MATRIX[0];
}

export function getLanguageFromDomain(hostname: string): string {
  const config = getDomainConfig(hostname);
  return config.primaryLanguage;
}

export function getSupportedLanguages(hostname: string): string[] {
  const config = getDomainConfig(hostname);
  return config.supportedLanguages;
}

export function getJurisdictionFromDomain(hostname: string): string {
  const config = getDomainConfig(hostname);
  return config.jurisdiction;
}

export function isLanguageSupportedForDomain(hostname: string, language: string): boolean {
  const supportedLanguages = getSupportedLanguages(hostname);
  return supportedLanguages.includes(language);
}

export function getFallbackLanguage(hostname: string): string {
  const config = getDomainConfig(hostname);
  return config.fallbackLanguage;
}

// Browser language detection with domain validation
export function detectBrowserLanguage(hostname: string): string {
  if (typeof navigator === 'undefined') return getLanguageFromDomain(hostname);

  const supportedLanguages = getSupportedLanguages(hostname);
  const browserLanguages = navigator.languages || [navigator.language];

  // Find first browser language that's supported by domain
  for (const browserLang of browserLanguages) {
    const lang = browserLang.split('-')[0].toLowerCase();
    if (supportedLanguages.includes(lang)) {
      return lang;
    }
  }

  // Return domain's primary language if no match
  return getLanguageFromDomain(hostname);
}

// Cookie-based language persistence
export function getLanguageFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const langCookie = cookies.find(cookie =>
    cookie.trim().startsWith('stronghold-lang=')
  );

  return langCookie ? langCookie.split('=')[1] : null;
}

export function setLanguageCookie(language: string, hostname: string): void {
  if (typeof document === 'undefined') return;

  const domain = hostname.includes('localhost') ? '' : `; domain=.${hostname}`;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1); // 1 month expiry

  document.cookie = `stronghold-lang=${language}; expires=${expires.toUTCString()}; path=/${domain}; SameSite=Lax`;
}

// Language routing helpers
export function getLanguageRoutes(hostname: string): Record<string, string> {
  const supportedLanguages = getSupportedLanguages(hostname);

  return supportedLanguages.reduce((routes, lang) => {
    routes[lang] = `/${lang}`;
    return routes;
  }, {} as Record<string, string>);
}

export function getLocalizedPath(pathname: string, language: string, hostname: string): string {
  const supportedLanguages = getSupportedLanguages(hostname);

  if (!supportedLanguages.includes(language)) {
    return pathname;
  }

  // Remove existing language prefix if present
  const pathWithoutLang = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');

  // Add new language prefix
  return `/${language}${pathWithoutLang === '/' ? '' : pathWithoutLang}`;
}

export function getCurrentLanguageFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  return match ? match[1] : null;
}