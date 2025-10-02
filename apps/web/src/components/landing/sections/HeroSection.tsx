"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export function HeroSection() {
  const { t, i18n } = useTranslation('landing');
  const [isVisible, setIsVisible] = useState(false);

  // Debug: log current language and translation values
  useEffect(() => {
    console.log('HeroSection Debug:', {
      currentLanguage: i18n.language,
      isReady: i18n.isInitialized,
      hasLoadedLanding: i18n.hasResourceBundle(i18n.language, 'landing'),
      titleTranslation: t('hero.title'),
      heroKeys: Object.keys(t('hero', { returnObjects: true }))
    });
  }, [i18n.language, t]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-navy-900 to-slate-800">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
        <div
          className="absolute top-0 left-0 w-full h-full opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      {/* Sofia Professional Introduction */}
      <div className="absolute top-24 right-24 hidden lg:block">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-lg max-w-sm">
          <div className="flex items-center space-x-md mb-md">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">Sofia</p>
              <p className="text-gray-300 text-sm">Family Protection Advisor</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            &quot;I&apos;ll guide you through creating a comprehensive Family Shield that protects your loved ones with precision and care.&quot;
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-lg text-center">
        <div className={`transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* Executive Value Proposition */}
          <div className="mb-xl">
            <p className="text-primary-light text-lg font-medium mb-md tracking-wide">
              {t('hero.tagline')}
            </p>
          </div>

          {/* Main Headline - Professional & Direct */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-lg leading-tight max-w-5xl mx-auto">
            {t('hero.title')}
            <span className="block text-primary-light mt-sm">{t('hero.titleHighlight')}</span>
            <span className="block mt-sm">{t('hero.titleSuffix')}</span>
          </h1>

          {/* Professional Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-2xl max-w-4xl mx-auto leading-relaxed font-light">
            {t('hero.subtitle')}
          </p>

          {/* Value Propositions Grid */}
          <div className="grid md:grid-cols-3 gap-lg mb-2xl max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-lg">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-md">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-xs">Graduated Access</h3>
              <p className="text-gray-400 text-sm">Sophisticated permissions protect privacy while enabling assistance</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-lg">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-md">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-xs">Intelligent Monitoring</h3>
              <p className="text-gray-400 text-sm">Your Family Shield monitors your wellbeing discreetly</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-lg">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-md">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-xs">Legal Compliance</h3>
              <p className="text-gray-400 text-sm">Documents crafted for SK, CZ, AT, DE, PL jurisdictions</p>
            </div>
          </div>

          {/* Professional Call to Action */}
          <div className="flex flex-col sm:flex-row gap-lg justify-center items-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-white px-2xl py-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-primary-light/20">
                {t('hero.ctaPrimary')}
              </Button>
            </Link>

            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium flex items-center space-x-sm group"
            >
              <span>{t('hero.ctaSecondary')}</span>
              <svg className="w-5 h-5 transform group-hover:translate-y-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
      </div>
    </section>
  );
}