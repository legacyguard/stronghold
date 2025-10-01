import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import { languageHelpers } from './language-matrix';

// Available namespaces for lazy loading
export const AVAILABLE_NAMESPACES = [
  'common',      // Shared texts (buttons, errors, general UI)
  'auth',        // Login, signup, authentication
  'dashboard',   // Dashboard specific texts
  'navigation',  // Menu, navigation, routing
  'vault',       // Document vault, file management
  'landing'      // Landing page content
] as const;

export type AvailableNamespace = typeof AVAILABLE_NAMESPACES[number];

// Default namespaces to load immediately
const DEFAULT_NAMESPACES = ['common', 'landing'];

// Initialize i18next with modular architecture
void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    // Language detection
    fallbackLng: 'en',
    lng: getInitialLanguage(),

    // Namespace configuration
    ns: DEFAULT_NAMESPACES,
    defaultNS: 'common',

    // Performance optimizations
    load: 'languageOnly', // Don't load country-specific variants (en-US -> en)

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // HTTP Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',

      // Add timeout and error handling
      requestOptions: {
        timeout: 5000,
      },
    },

    // React configuration
    react: {
      useSuspense: false, // We'll handle loading states manually
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },

    // Debug in development
    debug: process.env.NODE_ENV === 'development',

    // Missing key handling
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
      }
    },

    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
  });

/**
 * Get initial language based on domain and browser preferences
 */
function getInitialLanguage(): string {
  // Server-side: return default
  if (typeof window === 'undefined') {
    return 'sk';
  }

  const currentDomain = languageHelpers.getCurrentDomain();

  // Check for stored language preference
  const storedLanguage = localStorage.getItem('preferred-language');
  if (storedLanguage && languageHelpers.isLanguageSupported(currentDomain, storedLanguage)) {
    return storedLanguage;
  }

  // Parse browser languages
  const browserLanguages = navigator.languages || [navigator.language];
  const normalizedBrowserLangs = browserLanguages.map(lang => lang.split('-')[0].toLowerCase());

  // Get best match for domain
  return languageHelpers.getBestLanguageMatch(currentDomain, normalizedBrowserLangs);
}

/**
 * Load additional namespaces on demand
 */
export async function loadNamespace(namespace: AvailableNamespace): Promise<void> {
  if (!AVAILABLE_NAMESPACES.includes(namespace)) {
    console.warn(`Unknown namespace: ${namespace}`);
    return;
  }

  try {
    await i18n.loadNamespaces([namespace]);
  } catch (error) {
    console.error(`Failed to load namespace ${namespace}:`, error);
    // Fallback: try loading from common namespace
    if (namespace !== 'common') {
      console.info(`Falling back to common namespace for ${namespace}`);
    }
  }
}

/**
 * Load multiple namespaces at once
 */
export async function loadNamespaces(namespaces: AvailableNamespace[]): Promise<void> {
  const validNamespaces = namespaces.filter(ns => AVAILABLE_NAMESPACES.includes(ns));

  if (validNamespaces.length === 0) return;

  try {
    await i18n.loadNamespaces(validNamespaces);
  } catch (error) {
    console.error('Failed to load namespaces:', validNamespaces, error);
  }
}

/**
 * Change language and persist preference
 */
export async function changeLanguage(language: string): Promise<void> {
  const currentDomain = languageHelpers.getCurrentDomain();

  // Validate language is supported for current domain
  if (!languageHelpers.isLanguageSupported(currentDomain, language)) {
    console.warn(`Language ${language} not supported for domain ${currentDomain}`);
    return;
  }

  try {
    // Change language in i18next
    await i18n.changeLanguage(language);

    // Persist preference
    localStorage.setItem('preferred-language', language);

    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent('language-changed', {
      detail: { language, domain: currentDomain }
    }));

  } catch (error) {
    console.error('Failed to change language:', error);
  }
}

/**
 * Get current language info
 */
export function getCurrentLanguageInfo() {
  const currentLang = i18n.language;
  const currentDomain = languageHelpers.getCurrentDomain();
  const supportedLanguages = languageHelpers.getSupportedLanguages(currentDomain);
  const primaryLanguage = languageHelpers.getPrimaryLanguage(currentDomain);

  return {
    currentLanguage: currentLang,
    currentDomain,
    supportedLanguages,
    primaryLanguage,
    isSupported: supportedLanguages.includes(currentLang)
  };
}

// Export configured i18n instance
export default i18n;