'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { getDomainConfig, detectBrowserLanguage, getLanguageFromCookie, getLanguageFromDomain } from './domain-matrix';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

const isDevelopment = process.env.NODE_ENV === 'development';

// Don't initialize i18n here - will be done in I18nProvider

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
  hostname?: string;
}

export function I18nProvider({
  children,
  initialLanguage,
  hostname = typeof window !== 'undefined' ? window.location.host : 'localhost:3000'
}: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      if (i18n.isInitialized) {
        console.log('I18nProvider: i18n already initialized, current language:', i18n.language);
        setIsReady(true);
        return;
      }

      const domainConfig = getDomainConfig(hostname);
      console.log('I18nProvider: Domain config:', domainConfig);

      // Determine language priority:
      // 1. Initial language (from URL or server)
      // 2. Cookie language (if supported by domain)
      // 3. Browser language (if supported by domain)
      // 4. Domain primary language
      let targetLanguage = initialLanguage;
      console.log('I18nProvider: Initial language from props:', initialLanguage);

      if (!targetLanguage) {
        const cookieLang = getLanguageFromCookie();
        console.log('I18nProvider: Cookie language:', cookieLang);
        if (cookieLang && domainConfig.supportedLanguages.includes(cookieLang)) {
          targetLanguage = cookieLang;
        }
      }

      if (!targetLanguage) {
        // Skip browser detection for now, use domain primary language
        targetLanguage = domainConfig.primaryLanguage;
      }

      console.log('I18nProvider: Final target language:', targetLanguage);
      console.log('I18nProvider: Hostname:', hostname);

      try {
        const namespaces = [
          'common',
          'landing',
          'onboarding',
          'dashboard',
          'family',
          'emergency',
          'will-generator',
          'legal'
        ];

        // Initialize i18n with the correct language
        await i18n
          .use(HttpApi)
          .use(initReactI18next)
          .init({
            lng: targetLanguage,
            fallbackLng: 'en',
            debug: isDevelopment,

            // HTTP backend configuration
            backend: {
              loadPath: typeof window !== 'undefined'
                ? `${window.location.origin}/locales/{{lng}}/{{ns}}.json`
                : 'http://localhost:3000/locales/{{lng}}/{{ns}}.json',
              addPath: '/locales/add/{{lng}}/{{ns}}',
            },

            // Namespace configuration
            defaultNS: 'common',
            ns: namespaces,

            // React i18next configuration
            react: {
              // Disable suspense to avoid rendering keys before resources load
              useSuspense: false,
            },

            // Interpolation options
            interpolation: {
              escapeValue: false, // React already escapes values
            },

            // Missing key handling
            missingKeyHandler: (lng, ns, key, fallbackValue) => {
              if (isDevelopment) {
                console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
              }
            },
          });

        // Ensure all namespaces are loaded before rendering
        await i18n.loadNamespaces(namespaces);

        console.log('I18nProvider: Successfully initialized with language:', targetLanguage);
        setIsReady(true);
      } catch (error) {
        console.error('I18nProvider: Failed to initialize i18n:', error);
        setIsReady(true); // Still allow rendering
      }
    };

    initializeI18n();
  }, [initialLanguage, hostname]);

  // Client-side effect to detect cookie changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkLanguageChange = () => {
      const domainConfig = getDomainConfig(hostname);
      const cookieLang = getLanguageFromCookie();

      if (cookieLang && domainConfig.supportedLanguages.includes(cookieLang) && i18n.language !== cookieLang) {
        i18n.changeLanguage(cookieLang);
      }
    };

    // Check immediately
    checkLanguageChange();

    // Check periodically for cookie changes
    const interval = setInterval(checkLanguageChange, 1000);

    return () => clearInterval(interval);
  }, [hostname]);

  // Show loading until language is initialized
  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#6B8E23'
      }}>
        Načítava sa...
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

// Hook for accessing domain configuration
export function useDomainConfig() {
  const hostname = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  return getDomainConfig(hostname);
}

// Hook for language switching with domain validation
export function useLanguageSwitch() {
  const domainConfig = useDomainConfig();

  const switchLanguage = async (language: string) => {
    if (!domainConfig.supportedLanguages.includes(language)) {
      console.warn(`Language ${language} not supported for domain ${domainConfig.domain}`);
      return false;
    }

    try {
      await i18n.changeLanguage(language);

      // Save to cookie for persistence
      const hostname = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      if (typeof document !== 'undefined') {
        const domain = hostname.includes('localhost') ? '' : `; domain=.${hostname.split(':')[0]}`;
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);

        document.cookie = `stronghold-lang=${language}; expires=${expires.toUTCString()}; path=/${domain}; SameSite=Lax`;
      }

      return true;
    } catch (error) {
      console.error('Failed to switch language:', error);
      return false;
    }
  };

  return {
    supportedLanguages: domainConfig.supportedLanguages,
    currentLanguage: i18n.language,
    switchLanguage,
    domainConfig
  };
}