"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslationMock';

export function FinalCTASection() {
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-navy-900 to-slate-800"
      id="final-cta"
    >
      {/* Professional Executive Background */}
      <div className="absolute inset-0">
        {/* Sophisticated geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M50 50L50 0L100 50L50 100L0 50Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
        </div>

        {/* Executive gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent"></div>
      </div>

      {/* Sofia - Executive Advisor */}
      <div className="absolute top-20 left-20 hidden xl:block">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-xl max-w-md">
          <div className="flex items-start space-x-lg mb-lg">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Sofia</h4>
              <p className="text-primary-light text-sm font-medium">Senior Family Protection Advisor</p>
              <p className="text-gray-400 text-xs mt-xs">Certified Legal Technology Specialist</p>
            </div>
          </div>
          <blockquote className="text-gray-300 text-base leading-relaxed italic border-l-2 border-primary pl-md">
            &quot;Your family&apos;s protection requires precision, not perfection. Let&apos;s build your Family Shield with the expertise your legacy deserves.&quot;
          </blockquote>
        </div>
      </div>
      {/* Main Content - Executive Decision */}
      <div className="relative z-20 max-w-6xl mx-auto px-lg text-center">
        <div className={`transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* Executive Summary */}
          <div className="mb-xl">
            <p className="text-primary-light text-lg font-medium tracking-wide">
              EXECUTIVE DECISION POINT
            </p>
          </div>

          {/* Direct Call to Action */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-lg leading-tight max-w-5xl mx-auto">
            Your Family Shield
            <span className="block text-primary-light mt-sm">Awaits Activation</span>
          </h2>

          {/* Value Summary */}
          <p className="text-xl md:text-2xl text-gray-300 mb-2xl max-w-4xl mx-auto leading-relaxed font-light">
            Deploy comprehensive protection with military-grade security and legal precision.
            <span className="block mt-sm text-primary-light">Your thoughtful preparation is a gift of peace of mind.</span>
          </p>

          {/* Key Benefits - Executive Format */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-lg mb-2xl max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-lg">
              <div className="text-primary text-3xl font-bold mb-sm">2-5</div>
              <p className="text-white font-medium text-sm">Minutes to Complete</p>
              <p className="text-gray-400 text-xs">Guided Setup Process</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-lg">
              <div className="text-primary text-3xl font-bold mb-sm">5</div>
              <p className="text-white font-medium text-sm">Jurisdictions</p>
              <p className="text-gray-400 text-xs">SK, CZ, AT, DE, PL</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-lg">
              <div className="text-primary text-3xl font-bold mb-sm">24/7</div>
              <p className="text-white font-medium text-sm">Protection Monitoring</p>
              <p className="text-gray-400 text-xs">Intelligent Safeguards</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-lg">
              <div className="text-primary text-3xl font-bold mb-sm">∞</div>
              <p className="text-white font-medium text-sm">Peace of Mind</p>
              <p className="text-gray-400 text-xs">For Your Family</p>
            </div>
          </div>

          {/* Executive Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-lg justify-center items-center mb-2xl">
            <Link href="/onboarding">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-white px-2xl py-lg text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 border border-primary-light/20">
                Configure Family Shield Now
              </Button>
            </Link>

            <Link href="/verify">
              <Button variant="outline" size="lg" className="border-2 border-gray-300 text-gray-300 hover:bg-white/5 hover:text-white px-xl py-lg text-lg font-semibold backdrop-blur-sm transition-all duration-200">
                Verify Existing Setup
              </Button>
            </Link>
          </div>

          {/* Trust & Security Indicators */}
          <div className="grid md:grid-cols-4 gap-lg text-center max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-xs">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">Military-Grade</p>
              <p className="text-gray-400 text-xs">End-to-End Encryption</p>
            </div>

            <div className="flex flex-col items-center space-y-xs">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">Privacy First</p>
              <p className="text-gray-400 text-xs">GDPR Compliant</p>
            </div>

            <div className="flex flex-col items-center space-y-xs">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">Legal Precision</p>
              <p className="text-gray-400 text-xs">Multi-Jurisdiction</p>
            </div>

            <div className="flex flex-col items-center space-y-xs">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">Instant Activation</p>
              <p className="text-gray-400 text-xs">Deploy Immediately</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}