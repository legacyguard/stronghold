"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslationMock';

export function HeroSection() {
  const { t } = useTranslation('landing');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('mousemove', handleMouseMove);
      return () => section.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
    >
      {/* Background Stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Sofia - Professional Guiding Light */}
      <div
        className="absolute transition-all duration-1000 ease-out pointer-events-none"
        style={{
          left: `${45 + mousePosition.x * 10}%`,
          top: `${25 + mousePosition.y * 5}%`,
          transform: `translate(-50%, -50%) scale(${0.8 + mousePosition.x * 0.2})`,
        }}
      >
        <div className="relative">
          {/* Outer Glow */}
          <div className="absolute inset-0 w-32 h-32 bg-primary rounded-full opacity-20 blur-xl animate-pulse" />

          {/* Middle Glow */}
          <div className="absolute inset-2 w-28 h-28 bg-primary-light rounded-full opacity-40 blur-lg animate-pulse"
               style={{ animationDelay: '0.5s' }} />

          {/* Core Light - Professional Design */}
          <div className="relative w-24 h-24 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center shadow-2xl">
            {/* Inner pattern for sophistication */}
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white/40 rounded-full" />
            </div>

            {/* Subtle rotating elements */}
            <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute inset-1 border border-white/10 rounded-full animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
          </div>

          {/* Floating particles around Sofia */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/60 rounded-full animate-float"
              style={{
                left: `${Math.cos(i * Math.PI / 4) * 60 + 50}px`,
                top: `${Math.sin(i * Math.PI / 4) * 60 + 50}px`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-lg text-center">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Greeting from Sofia */}
          <div className="mb-lg">
            <p className="text-primary-light text-lg mb-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
              {t('hero.greeting')}
            </p>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-lg leading-tight">
            <span className={`block transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '1s' }}>
              {t('hero.headline.line1')}
            </span>
            <span className={`block text-primary-light transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '1.3s' }}>
              {t('hero.headline.line2')}
            </span>
            <span className={`block transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '1.6s' }}>
              {t('hero.headline.line3')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-xl md:text-2xl text-gray-300 mb-2xl max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
             style={{ animationDelay: '2s' }}>
            {t('hero.subtitle')}
          </p>

          {/* Call to Action */}
          <div className={`flex flex-col sm:flex-row gap-md justify-center items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
               style={{ animationDelay: '2.3s' }}>
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-white px-xl py-lg text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                {t('hero.cta.primary')}
              </Button>
            </Link>

            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-primary-light hover:text-white transition-colors duration-300 text-lg font-medium flex items-center space-x-xs"
            >
              <span>{t('hero.cta.secondary')}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-lg left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </section>
  );
}