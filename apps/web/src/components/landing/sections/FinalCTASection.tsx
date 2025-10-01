"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslationMock';

export function FinalCTASection() {
  const { t } = useTranslation('landing');
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-black"
      id="final-cta"
    >
      {/* Night Sky Background */}
      <div className="absolute inset-0">
        {/* Stars */}
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 70}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}

        {/* Moon */}
        <div
          className="absolute w-32 h-32 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full shadow-2xl transition-all duration-1000"
          style={{
            top: '10%',
            right: `${20 + mousePosition.x * 5}%`,
            transform: `scale(${0.8 + mousePosition.y * 0.2})`,
          }}
        >
          {/* Moon craters */}
          <div className="absolute top-4 left-6 w-3 h-3 bg-yellow-300/50 rounded-full" />
          <div className="absolute top-8 right-8 w-2 h-2 bg-yellow-300/50 rounded-full" />
          <div className="absolute bottom-6 left-8 w-4 h-4 bg-yellow-300/50 rounded-full" />

          {/* Moon glow */}
          <div className="absolute inset-0 bg-yellow-200 rounded-full opacity-30 blur-xl scale-150" />
        </div>

        {/* Mountain Silhouettes */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Back mountains */}
          <svg
            className="absolute bottom-0 w-full h-64 fill-slate-700"
            viewBox="0 0 1200 300"
            preserveAspectRatio="xMidYMax slice"
          >
            <path d="M0,300 L0,180 Q200,120 400,160 T800,140 L1200,100 L1200,300 Z" />
          </svg>

          {/* Front mountains */}
          <svg
            className="absolute bottom-0 w-full h-48 fill-slate-800"
            viewBox="0 0 1200 200"
            preserveAspectRatio="xMidYMax slice"
          >
            <path d="M0,200 L0,120 Q300,80 600,100 T1200,80 L1200,200 Z" />
          </svg>

          {/* Ground */}
          <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Sofia's Farewell Light */}
      <div
        className="absolute transition-all duration-2000 ease-out pointer-events-none z-10"
        style={{
          left: `${30 + mousePosition.x * 40}%`,
          top: `${20 + mousePosition.y * 10}%`,
          transform: `translate(-50%, -50%) scale(${0.6 + mousePosition.x * 0.4})`,
        }}
      >
        <div className="relative">
          {/* Soft outer glow */}
          <div className="absolute inset-0 w-40 h-40 bg-primary rounded-full opacity-10 blur-2xl animate-pulse" />

          {/* Main light */}
          <div className="relative w-20 h-20 bg-gradient-to-r from-primary-light to-primary rounded-full flex items-center justify-center shadow-2xl">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white/50 rounded-full animate-pulse" />
            </div>

            {/* Gentle rays */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-8 bg-gradient-to-t from-primary-light to-transparent opacity-60"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-40px)`,
                  transformOrigin: 'bottom',
                }}
              />
            ))}
          </div>

          {/* Trail effect */}
          <div className="absolute inset-0 w-20 h-20 bg-primary-light/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-lg text-center">
        <div className={`transition-all duration-1500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {/* Sofia's Farewell Message */}
          <div className="mb-2xl">
            <div className={`inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-lg py-md mb-lg transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                 style={{ transitionDelay: '0.5s' }}>
              <p className="text-primary-light text-lg italic">
                "{t('finalCTA.sofia.message')}"
              </p>
              <p className="text-white/80 text-sm mt-xs">
                - Sofia, {t('finalCTA.sofia.title')}
              </p>
            </div>
          </div>

          {/* Main Headline */}
          <h2 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-lg leading-tight transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '1s' }}>
            <span className="block">
              {t('finalCTA.headline.line1')}
            </span>
            <span className="block text-primary-light">
              {t('finalCTA.headline.line2')}
            </span>
          </h2>

          {/* Subtitle */}
          <p className={`text-xl md:text-2xl text-gray-300 mb-2xl max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
             style={{ transitionDelay: '1.3s' }}>
            {t('finalCTA.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-lg justify-center items-center mb-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
               style={{ transitionDelay: '1.6s' }}>
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-white px-2xl py-lg text-xl font-bold shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105">
                {t('finalCTA.buttons.primary')}
              </Button>
            </Link>

            <Link href="/verify">
              <Button variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 px-xl py-lg text-lg font-semibold backdrop-blur-sm transition-all duration-300">
                {t('finalCTA.buttons.secondary')}
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className={`flex flex-wrap justify-center items-center gap-lg text-white/60 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
               style={{ transitionDelay: '1.9s' }}>
            <div className="flex items-center space-x-xs">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium">{t('finalCTA.trust.secure')}</span>
            </div>

            <div className="flex items-center space-x-xs">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-medium">{t('finalCTA.trust.private')}</span>
            </div>

            <div className="flex items-center space-x-xs">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="text-sm font-medium">{t('finalCTA.trust.trusted')}</span>
            </div>

            <div className="flex items-center space-x-xs">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium">{t('finalCTA.trust.instant')}</span>
            </div>
          </div>

          {/* Final Peace Message */}
          <div className={`mt-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
               style={{ transitionDelay: '2.2s' }}>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-xl border border-white/10">
              <p className="text-lg text-white/90 italic leading-relaxed">
                {t('finalCTA.peace.message')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gentle scroll indicator */}
      <div className="absolute bottom-lg left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center space-y-sm text-white/40">
          <span className="text-sm font-medium">{t('finalCTA.scrollDown')}</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        .animate-twinkle {
          animation: twinkle var(--duration, 3s) ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow var(--duration, 10s) ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}