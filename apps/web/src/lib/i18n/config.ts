import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations directly
import commonSk from '@/../public/locales/sk/common.json';
import landingSk from '@/../public/locales/sk/landing.json';
import onboardingSk from '@/../public/locales/sk/onboarding.json';
import dashboardSk from '@/../public/locales/sk/dashboard.json';
import familySk from '@/../public/locales/sk/family.json';
import emergencySk from '@/../public/locales/sk/emergency.json';
import willGeneratorSk from '@/../public/locales/sk/will-generator.json';
import legalSk from '@/../public/locales/sk/legal.json';

import commonEn from '@/../public/locales/en/common.json';
import landingEn from '@/../public/locales/en/landing.json';
import onboardingEn from '@/../public/locales/en/onboarding.json';
import dashboardEn from '@/../public/locales/en/dashboard.json';
import familyEn from '@/../public/locales/en/family.json';
import emergencyEn from '@/../public/locales/en/emergency.json';
import willGeneratorEn from '@/../public/locales/en/will-generator.json';
import legalEn from '@/../public/locales/en/legal.json';

import commonCs from '@/../public/locales/cs/common.json';
import landingCs from '@/../public/locales/cs/landing.json';
import onboardingCs from '@/../public/locales/cs/onboarding.json';
import dashboardCs from '@/../public/locales/cs/dashboard.json';
import familyCs from '@/../public/locales/cs/family.json';
import emergencyCs from '@/../public/locales/cs/emergency.json';
import willGeneratorCs from '@/../public/locales/cs/will-generator.json';
import legalCs from '@/../public/locales/cs/legal.json';

const isDevelopment = process.env.NODE_ENV === 'development';

// Resources bundle
const resources = {
  sk: {
    common: commonSk,
    landing: landingSk,
    onboarding: onboardingSk,
    dashboard: dashboardSk,
    family: familySk,
    emergency: emergencySk,
    'will-generator': willGeneratorSk,
    legal: legalSk,
  },
  en: {
    common: commonEn,
    landing: landingEn,
    onboarding: onboardingEn,
    dashboard: dashboardEn,
    family: familyEn,
    emergency: emergencyEn,
    'will-generator': willGeneratorEn,
    legal: legalEn,
  },
  cs: {
    common: commonCs,
    landing: landingCs,
    onboarding: onboardingCs,
    dashboard: dashboardCs,
    family: familyCs,
    emergency: emergencyCs,
    'will-generator': willGeneratorCs,
    legal: legalCs,
  },
};

i18n
  .use(initReactI18next)
  .init({
    lng: 'sk', // default language
    fallbackLng: 'en',
    debug: isDevelopment,

    // Resources
    resources,

    // Namespace configuration
    defaultNS: 'common',
    ns: [
      'common',
      'landing',
      'onboarding',
      'dashboard',
      'family',
      'emergency',
      'will-generator',
      'legal'
    ],

    // React i18next configuration
    react: {
      useSuspense: false, // Disable suspense for simplicity
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

export default i18n;

// Type-safe translation hook
export type TranslationNamespace =
  | 'common'
  | 'landing'
  | 'onboarding'
  | 'dashboard'
  | 'family'
  | 'emergency'
  | 'will-generator'
  | 'legal';

// Translation key validation for development
export const validateTranslationKey = (namespace: string, key: string): boolean => {
  if (!isDevelopment) return true;

  const validNamespaces = [
    'common', 'landing', 'onboarding', 'dashboard',
    'family', 'emergency', 'will-generator', 'legal'
  ];

  if (!validNamespaces.includes(namespace)) {
    console.error(`Invalid namespace: ${namespace}`);
    return false;
  }

  return true;
};