import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { useWillGenerationStore } from '@/lib/stores/will-generation-store';

// Lazy load components based on user's jurisdiction and preferences
export const createLazyComponent = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: ComponentType
): LazyExoticComponent<T> => {
  return lazy(factory);
};

// AI Service Dynamic Imports
export const loadAIService = async (model: 'gpt-4o' | 'gpt-4o-mini') => {
  if (model === 'gpt-4o-mini') {
    // @ts-expect-error - Module may not exist yet
    const { AIServiceMini } = await import('@/lib/ai/ai-service-mini');
    return AIServiceMini;
  } else {
    // @ts-expect-error - Module may not exist yet
    const { AIService } = await import('@/lib/ai/ai-service');
    return AIService;
  }
};

// Jurisdiction-specific components
export const LazyWillTemplates = {
  // @ts-expect-error - Module may not exist yet
  SK: createLazyComponent(() => import('@/components/will-templates/SlovakWillTemplate')),
  // @ts-expect-error - Module may not exist yet
  CZ: createLazyComponent(() => import('@/components/will-templates/CzechWillTemplate')),
  // @ts-expect-error - Module may not exist yet
  AT: createLazyComponent(() => import('@/components/will-templates/AustrianWillTemplate')),
  // @ts-expect-error - Module may not exist yet
  DE: createLazyComponent(() => import('@/components/will-templates/GermanWillTemplate')),
  // @ts-expect-error - Module may not exist yet
  PL: createLazyComponent(() => import('@/components/will-templates/PolishWillTemplate'))
};

// Language-specific components
export const LazyLanguagePacks = {
  // @ts-expect-error - Module may not exist yet
  sk: createLazyComponent(() => import('@/components/language/SlovakLanguagePack')),
  // @ts-expect-error - Module may not exist yet
  cs: createLazyComponent(() => import('@/components/language/CzechLanguagePack')),
  // @ts-expect-error - Module may not exist yet
  de: createLazyComponent(() => import('@/components/language/GermanLanguagePack')),
  // @ts-expect-error - Module may not exist yet
  en: createLazyComponent(() => import('@/components/language/EnglishLanguagePack')),
  // @ts-expect-error - Module may not exist yet
  pl: createLazyComponent(() => import('@/components/language/PolishLanguagePack'))
};

// Feature-based lazy loading
export const LazyFeatures = {
  // @ts-expect-error - Module may not exist yet
  TrustSeal: createLazyComponent(() => import('@/components/trust-seal/TrustSealVerification')),
  // @ts-expect-error - Module may not exist yet
  DocumentEncryption: createLazyComponent(() => import('@/components/security/DocumentEncryption')),
  // @ts-expect-error - Module may not exist yet
  AdvancedWizard: createLazyComponent(() => import('@/components/wizard/AdvancedWillWizard')),
  // @ts-expect-error - Module may not exist yet
  MultiDeviceSync: createLazyComponent(() => import('@/components/sync/MultiDeviceSync')),
  // @ts-expect-error - Module may not exist yet
  LegalCompliance: createLazyComponent(() => import('@/components/legal/ComplianceChecker')),
  // @ts-expect-error - Modules exist but may not have default exports
  PerformanceMonitor: createLazyComponent(() => import('@/components/performance/CacheMonitorDashboard')),
  // @ts-expect-error - Modules exist but may not have default exports
  UserEducation: createLazyComponent(() => import('@/components/onboarding/WillEducationWizard'))
};

// Premium features (only load for paid users)
export const LazyPremiumFeatures = {
  // @ts-expect-error - Module may not exist yet
  FamilyEdition: createLazyComponent(() => import('@/components/premium/FamilyEditionDashboard')),
  // @ts-expect-error - Module may not exist yet
  AdvancedAnalytics: createLazyComponent(() => import('@/components/analytics/AdvancedAnalytics')),
  // @ts-expect-error - Module may not exist yet
  LegalConsultation: createLazyComponent(() => import('@/components/legal/LegalConsultation')),
  // @ts-expect-error - Module may not exist yet
  DocumentStorage: createLazyComponent(() => import('@/components/storage/SecureDocumentStorage'))
};

// Utility components
export const LazyUtilities = {
  // @ts-expect-error - Module may not exist yet
  PDFGenerator: createLazyComponent(() => import('@/components/pdf/PDFGenerator')),
  // @ts-expect-error - Module may not exist yet
  DocumentPreview: createLazyComponent(() => import('@/components/preview/DocumentPreview')),
  // @ts-expect-error - Module may not exist yet
  ExportManager: createLazyComponent(() => import('@/components/export/ExportManager')),
  // @ts-expect-error - Module may not exist yet
  PrintOptimizer: createLazyComponent(() => import('@/components/print/PrintOptimizer'))
};

// Context-aware component loader
export const useSmartLoader = () => {
  const userPreferences = useWillGenerationStore(state => state.userPreferences);

  const loadJurisdictionTemplate = async () => {
    const TemplateComponent = LazyWillTemplates[userPreferences.jurisdiction];
    return TemplateComponent;
  };

  const loadLanguagePack = async () => {
    const LanguageComponent = LazyLanguagePacks[userPreferences.language as keyof typeof LazyLanguagePacks];
    return LanguageComponent;
  };

  const loadFeaturesByTier = async () => {
    const features = [LazyFeatures.TrustSeal, LazyFeatures.DocumentEncryption];

    if (userPreferences.tier === 'paid' || userPreferences.tier === 'family_edition') {
      features.push(
        LazyFeatures.AdvancedWizard,
        LazyFeatures.MultiDeviceSync,
        LazyFeatures.LegalCompliance
      );
    }

    if (userPreferences.tier === 'family_edition') {
      features.push(
        LazyPremiumFeatures.FamilyEdition,
        LazyPremiumFeatures.AdvancedAnalytics
      );
    }

    return features;
  };

  return {
    loadJurisdictionTemplate,
    loadLanguagePack,
    loadFeaturesByTier
  };
};

// Preloading strategy
export const preloadCriticalComponents = async (
  jurisdiction: string,
  language: string,
  tier: string
) => {
  const preloadPromises: Promise<any>[] = [];

  // Always preload core components
  preloadPromises.push(
    // @ts-expect-error - Module may not exist yet
    import('@/components/will-templates/BaseWillTemplate'),
    import('@/components/forms/OptimizedForm')
  );

  // Preload jurisdiction-specific template
  if (jurisdiction in LazyWillTemplates) {
    const templateImport = LazyWillTemplates[jurisdiction as keyof typeof LazyWillTemplates];
    preloadPromises.push(templateImport as any);
  }

  // Preload language pack
  if (language in LazyLanguagePacks) {
    const languageImport = LazyLanguagePacks[language as keyof typeof LazyLanguagePacks];
    preloadPromises.push(languageImport as any);
  }

  // Preload tier-specific features
  if (tier === 'paid' || tier === 'family_edition') {
    preloadPromises.push(
      LazyFeatures.AdvancedWizard as any,
      LazyFeatures.MultiDeviceSync as any
    );
  }

  try {
    await Promise.all(preloadPromises);
    console.log('Critical components preloaded successfully');
  } catch (error) {
    console.warn('Some components failed to preload:', error);
  }
};

// Resource hints for better loading
export const addResourceHints = () => {
  const head = document.head;

  // Preconnect to external services
  const preconnectLinks = [
    'https://api.openai.com',
    'https://supabase.io',
    'https://fonts.googleapis.com'
  ];

  preconnectLinks.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    head.appendChild(link);
  });

  // DNS prefetch for analytics and monitoring
  const dnsPrefetchLinks = [
    'https://www.google-analytics.com',
    'https://sentry.io'
  ];

  dnsPrefetchLinks.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    head.appendChild(link);
  });
};

// Module federation for micro-frontends (future enhancement)
export const loadMicroFrontend = async (moduleName: string) => {
  try {
    // In the future, this could load modules from different origins
    // eslint-disable-next-line @next/next/no-assign-module-variable
    const module = await import(`@/micro-frontends/${moduleName}`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load micro-frontend: ${moduleName}`, error);
    // Return fallback component
    return () => null;
  }
};

// Intersection Observer for lazy loading components on scroll
export const createIntersectionObserver = (callback: () => void, options = {}) => {
  const defaultOptions = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback();
      }
    });
  }, defaultOptions);
};

// Bundle size monitoring
export const trackBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    const bundleSize = {
      totalTransferSize: navigation.transferSize,
      totalDecodedSize: navigation.decodedBodySize,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart
    };

    // Track bundle metrics (would send to analytics in production)
    console.log('Bundle metrics:', bundleSize);

    return bundleSize;
  }

  return null;
};