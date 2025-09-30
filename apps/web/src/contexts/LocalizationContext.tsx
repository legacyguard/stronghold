"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { languageHelpers, SupportedLanguage, LANGUAGE_METADATA } from '@/lib/language-matrix';
import { changeLanguage, getCurrentLanguageInfo, loadNamespace, type AvailableNamespace } from '@/lib/i18n';

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
  getLanguageMetadata: (language: string) => typeof LANGUAGE_METADATA[SupportedLanguage] | null;

  // Loading states
  isChangingLanguage: boolean;
  isLoadingNamespace: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | null>(null);

interface LocalizationProviderProps {
  children: ReactNode;
}

export function LocalizationProvider({ children }: LocalizationProviderProps) {
  const { i18n } = useTranslation();

  // State management
  const [currentDomain, setCurrentDomain] = useState<string>('localhost');
  const [currentJurisdiction, setCurrentJurisdiction] = useState<string>('sk');
  const [currentLanguage, setCurrentLanguage] = useState<string>('sk');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['sk', 'cs', 'en']);
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('sk');
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isLoadingNamespace, setIsLoadingNamespace] = useState(false);

  // Initialize context on mount
  useEffect(() => {
    const initializeContext = () => {
      const domain = languageHelpers.getCurrentDomain();
      const supported = languageHelpers.getSupportedLanguages(domain);
      const primary = languageHelpers.getPrimaryLanguage(domain);
      const currentLang = i18n.language || primary;

      setCurrentDomain(domain);
      setSupportedLanguages(supported);
      setPrimaryLanguage(primary);
      setCurrentLanguage(currentLang);

      // For now, jurisdiction follows the primary language of the domain
      // This implements ADR 001: legal framework separate from UI language
      setCurrentJurisdiction(primary);
    };

    initializeContext();

    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    // Listen for i18next language changes
    const handleI18nLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    window.addEventListener('language-changed', handleLanguageChange as EventListener);
    i18n.on('languageChanged', handleI18nLanguageChange);

    return () => {
      window.removeEventListener('language-changed', handleLanguageChange as EventListener);
      i18n.off('languageChanged', handleI18nLanguageChange);
    };
  }, [i18n]);

  // Actions
  const handleSetLanguage = async (language: string): Promise<void> => {
    if (!languageHelpers.isLanguageSupported(currentDomain, language)) {
      console.warn(`Language ${language} not supported for domain ${currentDomain}`);
      return;
    }

    setIsChangingLanguage(true);
    try {
      await changeLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const handleLoadNamespace = async (namespace: AvailableNamespace): Promise<void> => {
    setIsLoadingNamespace(true);
    try {
      await loadNamespace(namespace);
    } catch (error) {
      console.error('Failed to load namespace:', error);
    } finally {
      setIsLoadingNamespace(false);
    }
  };

  // Helper methods
  const isLanguageSupported = (language: string): boolean => {
    return languageHelpers.isLanguageSupported(currentDomain, language);
  };

  const getLanguageMetadata = (language: string) => {
    if (language in LANGUAGE_METADATA) {
      return LANGUAGE_METADATA[language as SupportedLanguage];
    }
    return null;
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
 */
export function useNamespace(namespace: AvailableNamespace) {
  const { loadNamespace, isLoadingNamespace } = useLocalization();
  const { t, ready } = useTranslation(namespace);

  useEffect(() => {
    if (!ready) {
      loadNamespace(namespace);
    }
  }, [namespace, ready, loadNamespace]);

  return {
    t,
    ready,
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