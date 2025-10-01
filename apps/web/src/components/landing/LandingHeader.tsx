"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslationMock';

export function LandingHeader() {
  const { t } = useTranslation('landing');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = (language: string) => {
    // Language change functionality disabled for now
    console.log('Language change to:', language);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-lg py-md flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-sm">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-h2 font-bold text-text-dark">
            Stronghold
          </span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-lg">
          <a
            href="#how-it-works"
            className="text-body text-gray-600 hover:text-primary transition-colors"
          >
            {t('nav.howItWorks')}
          </a>
          <a
            href="#values"
            className="text-body text-gray-600 hover:text-primary transition-colors"
          >
            {t('nav.values')}
          </a>
          <a
            href="#security"
            className="text-body text-gray-600 hover:text-primary transition-colors"
          >
            {t('nav.security')}
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-sm">
          {/* Language Selector */}
          <div className="hidden sm:flex items-center space-x-xs">
            {['sk', 'cs', 'en'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-xs py-xs text-caption rounded transition-colors ${
                  'en' === lang
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-primary'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <Link href="/login">
            <Button variant="ghost" size="sm">
              {t('nav.login')}
            </Button>
          </Link>

          <Link href="/signup">
            <Button size="sm">
              {t('nav.getStarted')}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}