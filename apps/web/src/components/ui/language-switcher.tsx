"use client";

import React, { useState } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useLanguageSwitcher } from "@/contexts/LocalizationContext";

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function LanguageSwitcher({
  variant = 'default',
  className = ''
}: LanguageSwitcherProps) {
  const { currentLanguage, availableLanguages, setLanguage, isChangingLanguage } = useLanguageSwitcher();
  const [isOpen, setIsOpen] = useState(false);

  const currentLangData = availableLanguages.find(lang => lang.isCurrent);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) return;

    setIsOpen(false);
    await setLanguage(languageCode);
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isChangingLanguage}
          className="flex items-center gap-xs p-sm rounded-lg hover:bg-neutral-beige/50 transition-colors disabled:opacity-50"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4 text-text-light" />
          <span className="text-caption font-medium text-text-dark uppercase">
            {currentLanguage}
          </span>
          <ChevronDown className={`h-3 w-3 text-text-light transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-xs z-50 min-w-32 bg-surface border border-border/20 rounded-lg shadow-xl overflow-hidden">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    w-full flex items-center gap-sm px-sm py-xs text-left hover:bg-neutral-beige/50 transition-colors
                    ${lang.isCurrent ? 'bg-primary/10 text-primary' : 'text-text-dark'}
                  `}
                >
                  <span className="text-lg">
                    {lang.metadata?.flag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-caption font-medium uppercase">
                      {lang.code}
                    </div>
                  </div>
                  {lang.isCurrent && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChangingLanguage}
        className="flex items-center gap-sm p-md rounded-lg bg-surface border border-border/20 hover:bg-neutral-beige/50 transition-colors disabled:opacity-50 min-w-40"
      >
        <Globe className="h-5 w-5 text-text-light" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-sm">
            <span className="text-lg">
              {currentLangData?.metadata?.flag}
            </span>
            <span className="text-body font-medium text-text-dark">
              {currentLangData?.metadata?.nativeName}
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-text-light transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-xs z-50 w-full bg-surface border border-border/20 rounded-lg shadow-xl overflow-hidden">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`
                  w-full flex items-center gap-sm p-md text-left hover:bg-neutral-beige/50 transition-colors
                  ${lang.isCurrent ? 'bg-primary/10 text-primary' : 'text-text-dark'}
                `}
              >
                <span className="text-lg">
                  {lang.metadata?.flag}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium">
                    {lang.metadata?.nativeName}
                  </div>
                  <div className="text-caption text-text-light">
                    {lang.metadata?.name}
                  </div>
                </div>
                {lang.isCurrent && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}