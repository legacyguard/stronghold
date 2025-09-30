"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// Temporarily disable i18next to fix createContext issue
// import { useTranslation } from 'react-i18next';
// import { languageHelpers, SupportedLanguage, LANGUAGE_METADATA } from '@/lib/language-matrix';
// import { changeLanguage, getCurrentLanguageInfo, loadNamespace, type AvailableNamespace } from '@/lib/i18n';

// Simplified types for now
type SupportedLanguage = 'sk' | 'cs' | 'en' | 'de';
type AvailableNamespace = 'common' | 'auth' | 'dashboard' | 'navigation' | 'vault';

// Based on ARCH 02 and ADR 001: Separation of legal framework from UI language
interface LocalizationContextType {
  // Current state
  currentDomain: string;
  currentJurisdiction: string;  // Legal framework (sk, cs, de, etc.)
  currentLanguage: string;      // UI language (sk, cs, en)

  // Available options for current domain
  supportedLanguages: string[];
  primaryLanguage: string;

  // Actions
  setLanguage: (language: string) => Promise<void>;
  loadNamespace: (namespace: AvailableNamespace) => Promise<void>;

  // Helper methods
  isLanguageSupported: (language: string) => boolean;
  getLanguageMetadata: (language: string) => any | null;

  // Loading states
  isChangingLanguage: boolean;
  isLoadingNamespace: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | null>(null);

interface LocalizationProviderProps {
  children: ReactNode;
}

export function LocalizationProvider({ children }: LocalizationProviderProps) {
  // Simplified state management without i18next dependencies
  const [currentDomain, setCurrentDomain] = useState<string>('localhost');
  const [currentJurisdiction, setCurrentJurisdiction] = useState<string>('sk');
  const [currentLanguage, setCurrentLanguage] = useState<string>('sk');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['sk', 'cs', 'en']);
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('sk');
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isLoadingNamespace, setIsLoadingNamespace] = useState(false);

  // Initialize context on mount - simplified version
  useEffect(() => {
    const initializeContext = () => {
      // Simple fallback values for now
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const supported = ['sk', 'cs', 'en'];
      const primary = 'sk';
      const currentLang = 'sk';

      setCurrentDomain(domain);
      setSupportedLanguages(supported);
      setPrimaryLanguage(primary);
      setCurrentLanguage(currentLang);
      setCurrentJurisdiction(primary);
    };

    initializeContext();
  }, []);

  // Actions - simplified without external dependencies
  const handleSetLanguage = async (language: string): Promise<void> => {
    if (!supportedLanguages.includes(language)) {
      console.warn(`Language ${language} not supported for domain ${currentDomain}`);
      return;
    }

    setIsChangingLanguage(true);
    try {
      // Simplified language change - just update state for now
      setCurrentLanguage(language);
      console.log(`Language changed to: ${language}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const handleLoadNamespace = async (namespace: AvailableNamespace): Promise<void> => {
    setIsLoadingNamespace(true);
    try {
      // Simplified namespace loading - just log for now
      console.log(`Loading namespace: ${namespace}`);
    } catch (error) {
      console.error('Failed to load namespace:', error);
    } finally {
      setIsLoadingNamespace(false);
    }
  };

  // Helper methods - simplified
  const isLanguageSupported = (language: string): boolean => {
    return supportedLanguages.includes(language);
  };

  const getLanguageMetadata = (language: string) => {
    // Simplified metadata
    const metadata = {
      sk: { name: 'Slovenčina', flag: '🇸🇰' },
      cs: { name: 'Čeština', flag: '🇨🇿' },
      en: { name: 'English', flag: '🇺🇸' },
      de: { name: 'Deutsch', flag: '🇩🇪' }
    };
    return metadata[language as keyof typeof metadata] || null;
  };

  const contextValue: LocalizationContextType = {
    // Current state
    currentDomain,
    currentJurisdiction,
    currentLanguage,

    // Available options
    supportedLanguages,
    primaryLanguage,

    // Actions
    setLanguage: handleSetLanguage,
    loadNamespace: handleLoadNamespace,

    // Helper methods
    isLanguageSupported,
    getLanguageMetadata,

    // Loading states
    isChangingLanguage,
    isLoadingNamespace,
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
}

// Custom hook to use localization context
export function useLocalization(): LocalizationContextType {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }

  return context;
}

// Additional hooks for specific use cases

/**
 * Hook for components that need to load specific namespaces
 * Simplified version without i18next
 */
export function useNamespace(namespace: AvailableNamespace) {
  const { loadNamespace, isLoadingNamespace } = useLocalization();

  useEffect(() => {
    loadNamespace(namespace);
  }, [namespace, loadNamespace]);

  // Simplified translation function
  const t = (key: string) => {
    // Return the key as fallback for now
    return key;
  };

  return {
    t,
    ready: true,
    isLoading: isLoadingNamespace
  };
}

/**
 * Hook for language switching functionality
 */
export function useLanguageSwitcher() {
  const {
    currentLanguage,
    supportedLanguages,
    setLanguage,
    isChangingLanguage,
    getLanguageMetadata
  } = useLocalization();

  const availableLanguages = supportedLanguages.map(lang => ({
    code: lang,
    metadata: getLanguageMetadata(lang),
    isCurrent: lang === currentLanguage
  })).filter(lang => lang.metadata !== null);

  return {
    currentLanguage,
    availableLanguages,
    setLanguage,
    isChangingLanguage
  };
}