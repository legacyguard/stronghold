// Language Matrix Configuration based on I18N 02 — Language Matrix per Domain
// Single source of truth for supported languages per domain

export interface DomainLanguageConfig {
  primary: string;
  supported: string[];
}

// Tier 1 launch markets - core countries we're targeting first
export const SUPPORTED_LANGS_BY_DOMAIN: Record<string, DomainLanguageConfig> = {
  // Slovakia - our primary market
  'legacyguard.sk': {
    primary: 'sk',
    supported: ['sk', 'cs', 'en', 'de', 'uk']
  },
  'localhost': { // Development environment
    primary: 'sk',
    supported: ['sk', 'cs', 'en']
  },
  // Czech Republic
  'legacyguard.cz': {
    primary: 'cs',
    supported: ['cs', 'sk', 'en', 'de', 'uk']
  },
  // Germany
  'legacyguard.de': {
    primary: 'de',
    supported: ['de', 'en', 'pl', 'uk', 'ru']
  },
  // Default fallback
  'default': {
    primary: 'en',
    supported: ['en', 'sk', 'cs']
  }
};

// Helper functions for language detection and validation
export const languageHelpers = {
  /**
   * Get supported languages for a domain
   */
  getSupportedLanguages(host: string): string[] {
    const config = SUPPORTED_LANGS_BY_DOMAIN[host] || SUPPORTED_LANGS_BY_DOMAIN['default'];
    return config.supported;
  },

  /**
   * Get primary language for a domain
   */
  getPrimaryLanguage(host: string): string {
    const config = SUPPORTED_LANGS_BY_DOMAIN[host] || SUPPORTED_LANGS_BY_DOMAIN['default'];
    return config.primary;
  },

  /**
   * Check if language is supported for domain
   */
  isLanguageSupported(host: string, language: string): boolean {
    const supportedLanguages = this.getSupportedLanguages(host);
    return supportedLanguages.includes(language);
  },

  /**
   * Get best language match from browser preferences
   */
  getBestLanguageMatch(host: string, browserLanguages: string[]): string {
    const supportedLanguages = this.getSupportedLanguages(host);
    const primaryLanguage = this.getPrimaryLanguage(host);

    // Try to find exact match first
    for (const browserLang of browserLanguages) {
      const normalizedLang = browserLang.split('-')[0].toLowerCase(); // en-US -> en
      if (supportedLanguages.includes(normalizedLang)) {
        return normalizedLang;
      }
    }

    // Fallback to primary language for domain
    return primaryLanguage;
  },

  /**
   * Parse Accept-Language header
   */
  parseAcceptLanguage(acceptLanguage: string): string[] {
    if (!acceptLanguage) return [];

    return acceptLanguage
      .split(',')
      .map(lang => {
        const [language, q = 'q=1'] = lang.trim().split(';');
        const quality = parseFloat(q.replace('q=', ''));
        return { language: language.trim(), quality };
      })
      .sort((a, b) => b.quality - a.quality)
      .map(item => item.language);
  },

  /**
   * Detect current domain from window or provided host
   */
  getCurrentDomain(): string {
    if (typeof window === 'undefined') return 'localhost';
    return window.location.hostname;
  }
};

// Available languages metadata
export const LANGUAGE_METADATA = {
  sk: { name: 'Slovenčina', nativeName: 'Slovenčina', flag: '🇸🇰' },
  cs: { name: 'Čeština', nativeName: 'Čeština', flag: '🇨🇿' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  de: { name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_METADATA;