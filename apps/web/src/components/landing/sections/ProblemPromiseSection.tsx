"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslationMock';

export function ProblemPromiseSection() {
  const { t } = useTranslation('landing');
  const [isVisible, setIsVisible] = useState(false);
  const [transformStep, setTransformStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Start transformation sequence
          setTimeout(() => setTransformStep(1), 1000);
          setTimeout(() => setTransformStep(2), 2500);
          setTimeout(() => setTransformStep(3), 4000);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-2xl bg-gradient-to-b from-slate-900 to-slate-50"
      id="problem-promise"
    >
      <div className="max-w-6xl mx-auto px-lg">
        {/* Section Header */}
        <div className={`text-center mb-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-md">
            {t('problemPromise.title')}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('problemPromise.subtitle')}
          </p>
        </div>

        {/* Transformation Container */}
        <div className="relative">
          {/* The Chaos Box - Before */}
          <div className={`transition-all duration-2000 ${transformStep >= 1 ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}`}>
            <div className="bg-gradient-to-br from-red-900/80 to-orange-900/80 rounded-2xl p-xl mb-xl backdrop-blur-sm border border-red-500/30">
              <div className="grid md:grid-cols-2 gap-xl items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-lg">
                    {t('problemPromise.chaos.title')}
                  </h3>
                  <ul className="space-y-md text-gray-300">
                    {t('problemPromise.chaos.problems', { returnObjects: true }).map((problem: string, index: number) => (
                      <li key={index} className="flex items-start space-x-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{problem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Chaos Visualization */}
                <div className="relative h-64 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {/* Scattered papers/documents */}
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-8 h-10 bg-white/20 rounded border border-red-300/50 transition-all duration-3000 ${
                          transformStep >= 1 ? 'opacity-30' : 'opacity-100'
                        }`}
                        style={{
                          left: `${Math.random() * 80}%`,
                          top: `${Math.random() * 80}%`,
                          transform: `rotate(${Math.random() * 360}deg)`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}

                    {/* Stress indicators */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-red-500 rounded-full animate-pulse opacity-60" />
                      <div className="absolute w-24 h-24 border-2 border-orange-500 rounded-full animate-ping opacity-40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transformation Arrow */}
          <div className={`flex justify-center my-xl transition-all duration-1000 ${transformStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className="bg-primary rounded-full p-lg shadow-2xl">
              <svg className="w-8 h-8 text-white transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          {/* The Order Box - After */}
          <div className={`transition-all duration-2000 ${transformStep >= 2 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-primary/80 to-green-700/80 rounded-2xl p-xl backdrop-blur-sm border border-primary/30">
              <div className="grid md:grid-cols-2 gap-xl items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-lg">
                    {t('problemPromise.order.title')}
                  </h3>
                  <ul className="space-y-md text-gray-200">
                    {t('problemPromise.order.solutions', { returnObjects: true }).map((solution: string, index: number) => (
                      <li key={index} className="flex items-start space-x-sm">
                        <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Order Visualization - The Security Box */}
                <div className="relative h-64 flex items-center justify-center">
                  <div className={`relative transition-all duration-2000 ${transformStep >= 3 ? 'scale-100 opacity-100' : 'scale-75 opacity-70'}`}>
                    {/* The Stronghold Box */}
                    <div className="w-48 h-32 bg-gradient-to-br from-primary to-green-600 rounded-xl shadow-2xl relative overflow-hidden">
                      {/* Box shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse" />

                      {/* Lock mechanism */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>

                      {/* Organized documents inside */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex space-x-1">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className="w-4 h-6 bg-white/40 rounded border border-white/60"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Protection aura */}
                      <div className="absolute -inset-4 border-2 border-primary/30 rounded-2xl animate-pulse" />
                      <div className="absolute -inset-8 border border-primary/20 rounded-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Trust indicators floating around */}
                    {transformStep >= 3 && [...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-float"
                        style={{
                          left: `${[10, 80, 20, 70][i]}%`,
                          top: `${[20, 30, 70, 60][i]}%`,
                          animationDelay: `${i * 0.5}s`,
                        }}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final Promise Statement */}
          <div className={`text-center mt-2xl transition-all duration-1000 ${transformStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-xl border border-white/20">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-md">
                {t('problemPromise.promise.title')}
              </h3>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                {t('problemPromise.promise.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}