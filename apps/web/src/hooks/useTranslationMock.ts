// Mock implementation of useTranslation for landing pages
// Until i18next server-side issues are resolved

import { useMemo } from 'react';

// Translation data - just for landing page
const translations = {
  'landing': {
    // Hero section
    'hero.greeting': 'Hello, I\'m Sofia, your digital guardian',
    'hero.headline.line1': 'Secure Your',
    'hero.headline.line2': 'Family\'s Future',
    'hero.headline.line3': 'With Confidence',
    'hero.subtitle': 'Create legally compliant wills across 5 jurisdictions with AI guidance, military-grade security, and the peace of mind that comes with knowing your legacy is protected.',
    'hero.cta.primary': 'Start Your Will Today',
    'hero.cta.secondary': 'See How It Works',

    // Problem Promise section
    'problemPromise.title': 'From Chaos to Certainty',
    'problemPromise.subtitle': 'Transform the overwhelming complexity of estate planning into a clear, confident path forward.',
    'problemPromise.chaos.title': 'The Problem: Estate Planning Chaos',
    'problemPromise.order.title': 'The Solution: Your Digital Stronghold',
    'problemPromise.promise.title': 'Our Promise: Guaranteed Peace of Mind',
    'problemPromise.promise.description': 'We transform your life\'s most important document from a source of stress into a source of strength. Your family\'s future deserves nothing less than absolute certainty.',

    // How It Works
    'howItWorks.title': 'How Stronghold Works',
    'howItWorks.subtitle': 'Three simple steps to securing your family\'s future with confidence and legal compliance.',
    'howItWorks.steps.organize.title': 'Organize',
    'howItWorks.steps.organize.description': 'Sofia guides you through gathering information with intelligent questions that adapt to your situation. No legal jargon, just clear guidance.',
    'howItWorks.steps.protect.title': 'Protect',
    'howItWorks.steps.protect.description': 'Your data is secured with military-grade encryption. Every document is protected by multiple layers of security and verified for legal compliance.',
    'howItWorks.steps.define.title': 'Define',
    'howItWorks.steps.define.description': 'Get your legally compliant will with a unique Trust Seal. Your document is ready for execution with confidence in its validity.',

    // Values
    'values.title': 'Our Core Values',
    'values.subtitle': 'The principles that guide every decision in protecting your family\'s future.',
    'values.empathy.title': 'Deep Empathy',
    'values.empathy.description': 'We understand that creating a will is one of life\'s most emotionally challenging tasks. Sofia provides gentle, compassionate guidance every step of the way.',
    'values.security.title': 'Uncompromising Security',
    'values.security.description': 'Your most sensitive information deserves the highest protection. We use military-grade encryption and comply with international security standards.',
    'values.automation.title': 'Intelligent Automation',
    'values.automation.description': 'Complex legal processes become simple through AI guidance. We handle the complexity so you can focus on what matters most.',
    'values.legacy.title': 'Living Legacy',
    'values.legacy.description': 'Your will becomes more than a document—it\'s a living testament to your values and love for your family, protected for generations.',
    'values.unity.title': 'United in Purpose',
    'values.unity.description': 'These values work together to create something greater than the sum of their parts: absolute confidence in your family\'s protected future.',

    // Social Proof
    'socialProof.title': 'Trusted by Families, Verified by Experts',
    'socialProof.subtitle': 'Built on enterprise technology and backed by legal experts across Europe.',
    'socialProof.stats.encryption': 'Encryption',
    'socialProof.stats.uptime': 'Uptime',
    'socialProof.stats.jurisdictions': 'Jurisdictions',
    'socialProof.stats.compliance': 'Compliance',
    'socialProof.technology.title': 'Enterprise Technology Stack',
    'socialProof.partners.title': 'Legal Partners',
    'socialProof.partners.visitWebsite': 'Visit Website',
    'socialProof.partners.verified': 'Verified Partner',
    'socialProof.partners.legal': 'Legal Expert',
    'socialProof.security.title': 'Security & Compliance Certifications',

    // Final CTA
    'finalCTA.sofia.message': 'Your journey to peace of mind starts with a single step. I\'ll be with you every step of the way.',
    'finalCTA.sofia.title': 'Your Digital Guardian',
    'finalCTA.headline.line1': 'Ready to protect',
    'finalCTA.headline.line2': 'your family\'s future?',
    'finalCTA.subtitle': 'Join thousands of families who have found peace of mind through Stronghold. Your legacy deserves protection. Your family deserves certainty.',
    'finalCTA.buttons.primary': 'Create Your Will Now',
    'finalCTA.buttons.secondary': 'Verify Trust Seal',
    'finalCTA.trust.secure': 'Bank-level Security',
    'finalCTA.trust.private': '100% Private',
    'finalCTA.trust.trusted': 'Legally Verified',
    'finalCTA.trust.instant': 'Instant Access',
    'finalCTA.peace.message': 'Sleep peacefully tonight knowing your family\'s future is secure. Wake up tomorrow knowing you\'ve given them the greatest gift: certainty in uncertain times.',
    'finalCTA.scrollDown': 'Continue to Footer',

    // Navigation
    'nav.howItWorks': 'How It Works',
    'nav.values': 'Our Values',
    'nav.security': 'Security',
    'nav.login': 'Log In',
    'nav.getStarted': 'Get Started',

    // Footer
    'footer.description': 'Secure will generation platform trusted by families across Europe. Military-grade security meets compassionate guidance.',
    'footer.product.title': 'Product',
    'footer.product.howItWorks': 'How It Works',
    'footer.product.security': 'Security',
    'footer.product.trustSeal': 'Trust Seal Verification',
    'footer.product.getStarted': 'Get Started',
    'footer.legal.title': 'Legal',
    'footer.legal.privacy': 'Privacy Policy',
    'footer.legal.terms': 'Terms of Service',
    'footer.legal.contact': 'Contact Support',
    'footer.legal.legalSupport': 'Legal Questions',
    'footer.support.title': 'Support',
    'footer.support.language': 'Language',
    'footer.support.email': 'Support Email',
    'footer.support.hours': 'Support Hours',
    'footer.support.businessHours': 'Mon-Fri 9:00-18:00 CET',
    'footer.partners.title': 'Trusted Partners',
    'footer.partners.verified': 'Verified',
    'footer.rights': 'All rights reserved.',
    'footer.status.operational': 'All systems operational',
    'footer.status.secure': 'Secure connection'
  }
};

export function useTranslation(namespace: string = 'landing') {
  const t = useMemo(() => {
    return (key: string, options?: { returnObjects?: boolean }) => {
      const fullKey = `${namespace}.${key}`;

      // Handle special cases for arrays that need returnObjects: true
      if (options?.returnObjects) {
        if (key === 'problemPromise.chaos.problems') {
          return [
            "Complex legal requirements across jurisdictions",
            "Expensive lawyer consultations and lengthy processes",
            "Fear of making costly mistakes with family assets",
            "Overwhelming paperwork and confusing terminology",
            "Uncertainty about legal validity and compliance",
            "Procrastination due to emotional difficulty"
          ];
        }
        if (key === 'problemPromise.order.solutions') {
          return [
            "AI-guided process with Sofia's expert assistance",
            "Legally compliant templates for SK, CZ, AT, DE, PL",
            "Military-grade encryption protects your sensitive data",
            "Step-by-step wizard makes complex decisions simple",
            "Instant validation ensures legal compliance",
            "Trust Seal verification provides lasting confidence"
          ];
        }
      }

      // Normal translation lookup
      const translation = (translations as any)[namespace]?.[key];
      return translation || key; // Return key as fallback
    };
  }, [namespace]);

  return { t };
}