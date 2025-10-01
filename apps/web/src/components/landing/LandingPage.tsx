"use client";

import React from 'react';
import { HeroSection } from './sections/HeroSection';
import { ProblemPromiseSection } from './sections/ProblemPromiseSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { ValuesSection } from './sections/ValuesSection';
import { SocialProofSection } from './sections/SocialProofSection';
import { FinalCTASection } from './sections/FinalCTASection';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main>
        {/* Hero Section - Full screen with animated Sofia */}
        <HeroSection />

        {/* Problem & Promise - Chaos to Order transformation */}
        <ProblemPromiseSection />

        {/* How It Works - Interactive horizontal scroll */}
        <HowItWorksSection />

        {/* Our Values - Four key principles */}
        <ValuesSection />

        {/* Social Proof - Technology and partner logos */}
        <SocialProofSection />

        {/* Final CTA - Return to peaceful night landscape */}
        <FinalCTASection />
      </main>

      <LandingFooter />
    </div>
  );
}