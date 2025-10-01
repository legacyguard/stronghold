"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslationMock';

export function SocialProofSection() {
  const { t } = useTranslation('landing');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const technologies = [
    { name: 'Next.js', description: 'Enterprise-grade React framework', logo: '/tech/nextjs.svg', color: 'bg-gray-900' },
    { name: 'Supabase', description: 'Secure PostgreSQL database', logo: '/tech/supabase.svg', color: 'bg-green-600' },
    { name: 'Vercel', description: 'Global edge deployment', logo: '/tech/vercel.svg', color: 'bg-black' },
    { name: 'TypeScript', description: 'Type-safe development', logo: '/tech/typescript.svg', color: 'bg-blue-600' },
    { name: 'OpenAI', description: 'Advanced AI assistance', logo: '/tech/openai.svg', color: 'bg-gray-800' },
    { name: 'Tailwind', description: 'Professional design system', logo: '/tech/tailwind.svg', color: 'bg-cyan-500' }
  ];

  const partners = [
    {
      name: 'BrnoAdvokáti.cz',
      description: 'Legal expertise partner',
      logo: '/partners/brnoadvokati.png',
      website: 'https://brnoadvokati.cz',
      color: 'bg-blue-700'
    }
  ];

  const stats = [
    { number: '256-bit', label: t('socialProof.stats.encryption'), icon: '🔒' },
    { number: '99.9%', label: t('socialProof.stats.uptime'), icon: '⚡' },
    { number: '5', label: t('socialProof.stats.jurisdictions'), icon: '🌍' },
    { number: 'GDPR', label: t('socialProof.stats.compliance'), icon: '✅' }
  ];

  return (
    <section
      ref={sectionRef}
      className="py-2xl bg-gradient-to-b from-gray-50 to-white"
      id="social-proof"
    >
      <div className="max-w-7xl mx-auto px-lg">
        {/* Section Header */}
        <div className={`text-center mb-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-text-dark mb-md">
            {t('socialProof.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('socialProof.subtitle')}
          </p>
        </div>

        {/* Trust Statistics */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
             style={{ transitionDelay: '0.2s' }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center bg-white rounded-2xl p-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-3xl mb-sm">{stat.icon}</div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-xs">
                {stat.number}
              </div>
              <div className="text-gray-600 text-sm font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Technology Stack */}
        <div className={`mb-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
             style={{ transitionDelay: '0.4s' }}>
          <h3 className="text-2xl md:text-3xl font-bold text-text-dark text-center mb-xl">
            {t('socialProof.technology.title')}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-lg">
            {technologies.map((tech, index) => (
              <div
                key={tech.name}
                className={`group relative bg-white rounded-2xl p-lg shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                {/* Logo placeholder - in real implementation would use actual logos */}
                <div className={`w-16 h-16 ${tech.color} rounded-xl mx-auto mb-md flex items-center justify-center text-white font-bold text-lg transition-transform duration-300 group-hover:rotate-6`}>
                  {tech.name.charAt(0)}
                </div>

                <div className="text-center">
                  <h4 className="font-bold text-text-dark mb-xs group-hover:text-primary transition-colors duration-300">
                    {tech.name}
                  </h4>
                  <p className="text-xs text-gray-600 leading-tight">
                    {tech.description}
                  </p>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Floating verification badge */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Partners */}
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
             style={{ transitionDelay: '0.6s' }}>
          <h3 className="text-2xl md:text-3xl font-bold text-text-dark text-center mb-xl">
            {t('socialProof.partners.title')}
          </h3>

          <div className="flex justify-center">
            <div className="bg-white rounded-3xl p-xl shadow-2xl border border-gray-200 max-w-md w-full">
              {partners.map((partner) => (
                <div key={partner.name} className="text-center">
                  {/* Partner logo area - using provided logo */}
                  <div className="w-24 h-24 mx-auto mb-lg bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-xl">
                    <div className="text-white font-bold text-xl">BA</div>
                  </div>

                  <h4 className="text-xl font-bold text-text-dark mb-sm">
                    {partner.name}
                  </h4>
                  <p className="text-gray-600 mb-lg">
                    {partner.description}
                  </p>

                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-sm text-primary hover:text-primary-dark transition-colors duration-300 font-medium"
                  >
                    <span>{t('socialProof.partners.visitWebsite')}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  {/* Trust indicators */}
                  <div className="flex justify-center space-x-md mt-lg pt-lg border-t border-gray-200">
                    <div className="flex items-center space-x-xs text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm font-medium">{t('socialProof.partners.verified')}</span>
                    </div>

                    <div className="flex items-center space-x-xs text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-sm font-medium">{t('socialProof.partners.legal')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Certifications */}
        <div className={`mt-2xl text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
             style={{ transitionDelay: '0.8s' }}>
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-xl border border-primary/20">
            <h3 className="text-xl font-bold text-text-dark mb-lg">
              {t('socialProof.security.title')}
            </h3>

            <div className="flex flex-wrap justify-center items-center gap-lg">
              {/* Security badges */}
              <div className="flex items-center space-x-sm bg-white rounded-xl px-lg py-md shadow-md">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-800">ISO 27001</span>
              </div>

              <div className="flex items-center space-x-sm bg-white rounded-xl px-lg py-md shadow-md">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-800">GDPR Compliant</span>
              </div>

              <div className="flex items-center space-x-sm bg-white rounded-xl px-lg py-md shadow-md">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-800">SOC 2 Type II</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}