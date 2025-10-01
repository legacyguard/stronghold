"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslationMock';

interface Value {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function ValuesSection() {
  const { t } = useTranslation('landing');
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
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

  const values: Value[] = [
    {
      id: 'empathy',
      title: t('values.empathy.title'),
      description: t('values.empathy.description'),
      color: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      id: 'security',
      title: t('values.security.title'),
      description: t('values.security.description'),
      color: 'from-green-500 to-green-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 'automation',
      title: t('values.automation.title'),
      description: t('values.automation.description'),
      color: 'from-purple-500 to-purple-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'legacy',
      title: t('values.legacy.title'),
      description: t('values.legacy.description'),
      color: 'from-yellow-500 to-orange-500',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    }
  ];

  return (
    <section
      ref={sectionRef}
      className="py-2xl bg-gradient-to-b from-white to-gray-50"
      id="values"
    >
      <div className="max-w-7xl mx-auto px-lg">
        {/* Section Header */}
        <div className={`text-center mb-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-text-dark mb-md">
            {t('values.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('values.subtitle')}
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-xl">
          {values.map((value, index) => (
            <div
              key={value.id}
              className={`group relative transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 0.2}s` }}
              onMouseEnter={() => setHoveredValue(value.id)}
              onMouseLeave={() => setHoveredValue(null)}
            >
              <div className={`relative bg-white rounded-2xl p-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:scale-105 h-full border-2 ${
                hoveredValue === value.id
                  ? 'border-primary shadow-primary/20'
                  : 'border-transparent hover:border-primary/30'
              }`}>
                {/* Icon Container */}
                <div className={`relative mb-lg mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110`}>
                  <div className="text-white transition-transform duration-500 group-hover:rotate-12">
                    {value.icon}
                  </div>

                  {/* Floating particles */}
                  {hoveredValue === value.id && (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-white/60 rounded-full animate-float"
                          style={{
                            left: `${Math.cos(i * Math.PI / 3) * 40 + 50}%`,
                            top: `${Math.sin(i * Math.PI / 3) * 40 + 50}%`,
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`} />
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-text-dark mb-sm group-hover:text-primary transition-colors duration-300">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-body">
                    {value.description}
                  </p>
                </div>

                {/* Hover overlay */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                {/* Connection lines (visible on hover) */}
                {hoveredValue === value.id && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 w-px h-4 bg-primary transform -translate-x-1/2 -translate-y-4 animate-pulse" />
                    <div className="absolute bottom-0 left-1/2 w-px h-4 bg-primary transform -translate-x-1/2 translate-y-4 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Central Connection Visual */}
        <div className="relative mt-2xl">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary to-primary-dark rounded-full shadow-2xl relative">
              {/* Core symbol */}
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>

              {/* Connecting lines to values */}
              {values.map((_, index) => (
                <div
                  key={index}
                  className="absolute w-1 h-16 bg-gradient-to-r from-primary to-transparent"
                  style={{
                    transform: `rotate(${index * 90}deg) translateY(-80px)`,
                    transformOrigin: 'bottom',
                  }}
                />
              ))}

              {/* Rotating rings */}
              <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-2 border-2 border-white/30 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            </div>

            <div className="mt-lg">
              <h3 className="text-2xl font-bold text-text-dark mb-sm">
                {t('values.unity.title')}
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t('values.unity.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-8px) rotate(180deg);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}