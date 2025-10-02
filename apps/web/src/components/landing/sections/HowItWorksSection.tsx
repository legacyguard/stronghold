"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslationMock';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
}

export function HowItWorksSection() {
  const { t } = useTranslation('landing');
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-advance steps
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      const nextStep = (activeStep + 1) % 4; // Assuming 4 steps
      setActiveStep(nextStep);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isVisible, activeStep]);

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

  const steps: Step[] = [
    {
      id: 'organize',
      title: t('howItWorks.steps.organize.title'),
      description: t('howItWorks.steps.organize.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      visual: (
        <div className="relative w-full h-64 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4">
            {/* Form fields appearing */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-16 h-8 bg-primary/20 rounded border-2 border-primary transition-all duration-500 ${
                  activeStep === 0 ? 'opacity-100 scale-100' : 'opacity-50 scale-90'
                }`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          {/* Floating icons */}
          <div className="absolute inset-0">
            <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full animate-pulse" />
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      )
    },
    {
      id: 'protect',
      title: t('howItWorks.steps.protect.title'),
      description: t('howItWorks.steps.protect.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      visual: (
        <div className="relative w-full h-64 flex items-center justify-center">
          {/* Central document */}
          <div className={`relative transition-all duration-1000 ${
            activeStep === 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
          }`}>
            <div className="w-32 h-40 bg-white rounded-lg shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/20" />
              <div className="p-4">
                <div className="h-2 bg-gray-300 rounded mb-2" />
                <div className="h-2 bg-gray-300 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-300 rounded w-1/2" />
              </div>
            </div>

            {/* Protection shields */}
            {activeStep === 1 && [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 border-2 border-primary rounded-lg animate-pulse"
                style={{
                  transform: `scale(${1 + (i + 1) * 0.3})`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.6 - i * 0.2
                }}
              />
            ))}

            {/* Lock icon */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'define',
      title: t('howItWorks.steps.define.title'),
      description: t('howItWorks.steps.define.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      visual: (
        <div className="relative w-full h-64 flex items-center justify-center">
          {/* Trust seal visualization */}
          <div className={`relative transition-all duration-1000 ${
            activeStep === 2 ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
          }`}>
            {/* Main seal */}
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl relative">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>

              {/* Rotating rings */}
              <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
              <div className="absolute inset-2 border-2 border-white/20 rounded-full animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
            </div>

            {/* Floating verification badges */}
            {activeStep === 2 && [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-float"
                style={{
                  left: `${[70, 10, 80, 20][i]}%`,
                  top: `${[20, 60, 70, 30][i]}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const scrollToStep = (stepIndex: number) => {
    setActiveStep(stepIndex);
    if (scrollContainerRef.current) {
      const stepWidth = scrollContainerRef.current.scrollWidth / steps.length;
      scrollContainerRef.current.scrollTo({
        left: stepIndex * stepWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-2xl bg-gradient-to-b from-slate-50 to-white"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-lg">
        {/* Section Header */}
        <div className={`text-center mb-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-text-dark mb-md">
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-xl">
          <div className="flex space-x-md bg-white rounded-2xl p-sm shadow-lg border border-gray-200">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => scrollToStep(index)}
                className={`flex items-center space-x-sm px-lg py-md rounded-xl transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className={`transition-colors duration-300 ${
                  activeStep === index ? 'text-white' : 'text-primary'
                }`}>
                  {step.icon}
                </div>
                <span className="font-medium hidden sm:block">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Visual Section */}
          <div className="h-80 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center border-b border-gray-200">
            {steps[activeStep].visual}
          </div>

          {/* Content Section */}
          <div className="p-xl">
            <div className="grid md:grid-cols-3 gap-xl">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`text-center transition-all duration-500 ${
                    activeStep === index
                      ? 'opacity-100 scale-100'
                      : 'opacity-50 scale-95'
                  }`}
                >
                  <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-md transition-all duration-300 ${
                    activeStep === index
                      ? 'bg-primary text-white shadow-lg scale-110'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-text-dark mb-sm">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-xl">
          <div className="flex space-x-sm">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-primary scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}