"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function LandingFooter() {
  const { t } = useTranslation('landing');

  const handleLanguageChange = (language: string) => {
    // Language change functionality disabled for now
    console.log('Language change to:', language);
  };

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-lg py-2xl">
        <div className="grid md:grid-cols-4 gap-xl">
          {/* Brand Section */}
          <div className="space-y-md">
            <div className="flex items-center space-x-sm">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold">Stronghold</span>
            </div>
            <p className="text-gray-400 text-body leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex space-x-md">
              {/* Social Links */}
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-300"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-300"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold mb-lg">{t('footer.product.title')}</h3>
            <ul className="space-y-sm">
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.product.howItWorks')}
                </a>
              </li>
              <li>
                <a href="#values" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.product.security')}
                </a>
              </li>
              <li>
                <Link href="/verify" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.product.trustSeal')}
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.product.getStarted')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold mb-lg">{t('footer.legal.title')}</h3>
            <ul className="space-y-sm">
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <a href="mailto:support@stronghold.com" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.legal.contact')}
                </a>
              </li>
              <li>
                <a href="mailto:legal@stronghold.com" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.legal.legalSupport')}
                </a>
              </li>
            </ul>
          </div>

          {/* Languages & Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-lg">{t('footer.support.title')}</h3>

            {/* Language Selector */}
            <div className="mb-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-sm">{t('footer.support.language')}</h4>
              <div className="flex space-x-xs">
                {[
                  { code: 'sk', name: 'Slovenčina' },
                  { code: 'cs', name: 'Čeština' },
                  { code: 'en', name: 'English' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`px-sm py-xs text-sm rounded transition-colors duration-300 ${
                      'en' === lang.code
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Support Info */}
            <div className="space-y-sm text-gray-400 text-sm">
              <div>
                <span className="font-medium">{t('footer.support.email')}:</span>
                <br />
                <a href="mailto:support@stronghold.com" className="hover:text-white transition-colors duration-300">
                  support@stronghold.com
                </a>
              </div>
              <div>
                <span className="font-medium">{t('footer.support.hours')}:</span>
                <br />
                {t('footer.support.businessHours')}
              </div>
            </div>
          </div>
        </div>

        {/* Partners Section */}
        <div className="border-t border-gray-700 mt-2xl pt-xl">
          <div className="text-center mb-lg">
            <h3 className="text-lg font-semibold mb-md">{t('footer.partners.title')}</h3>
            <div className="flex justify-center items-center space-x-xl">
              {/* BrnoAdvokáti.cz */}
              <div className="flex items-center space-x-sm text-gray-400">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                  BA
                </div>
                <span className="text-sm">BrnoAdvokáti.cz</span>
                <span className="text-xs bg-green-600 text-white px-xs py-xs rounded">
                  {t('footer.partners.verified')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-xl pt-lg flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-md md:mb-0">
            © 2024 Stronghold. {t('footer.rights')}
          </div>

          <div className="flex items-center space-x-lg text-gray-400 text-sm">
            <div className="flex items-center space-x-xs">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span>{t('footer.status.operational')}</span>
            </div>

            <div className="flex items-center space-x-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{t('footer.status.secure')}</span>
            </div>

            <div className="text-xs bg-gray-800 px-sm py-xs rounded">
              v2.0.0
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}