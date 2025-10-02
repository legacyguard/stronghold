// Mock implementation of useTranslation for landing pages
// Until i18next server-side issues are resolved

import { useMemo } from 'react';

// Translation data - Family Shield Professional Messaging
const translations = {
  'landing': {
    // Hero section - Professional Family Shield messaging
    'hero.greeting': 'Sofia, Senior Family Protection Advisor',
    'hero.headline.line1': 'Deploy Your Family Shield',
    'hero.headline.line2': 'Military-Grade Security',
    'hero.headline.line3': 'Legal Precision',
    'hero.subtitle': 'Establish comprehensive succession safeguards across 5 European jurisdictions with sophisticated permissions and graduated access control.',
    'hero.cta.primary': 'Configure Your Family Shield',
    'hero.cta.secondary': 'See How It Works',

    // Problem Promise section - Family Shield messaging
    'problemPromise.title': 'From Uncertainty to Systematic Protection',
    'problemPromise.subtitle': 'Deploy intelligent family protection measures with graduated access and sophisticated permissions.',
    'problemPromise.chaos.title': 'The Challenge: Fragmented Protection Systems',
    'problemPromise.order.title': 'The Solution: Your Integrated Family Shield',
    'problemPromise.promise.title': 'Our Commitment: Operational Excellence',
    'problemPromise.promise.description': 'Your Family Shield operates with surgical accuracy, providing graduated access levels that ensure appropriate information sharing while maintaining absolute privacy.',

    // How It Works - Professional Family Shield process
    'howItWorks.title': 'How Your Family Shield Operates',
    'howItWorks.subtitle': 'Three strategic phases to establish comprehensive family protection with military-grade security.',
    'howItWorks.steps.organize.title': 'Configure',
    'howItWorks.steps.organize.description': 'Sofia conducts systematic assessment of your family protection requirements with precision-engineered workflows. Professional guidance without complexity.',
    'howItWorks.steps.protect.title': 'Secure',
    'howItWorks.steps.protect.description': 'Your Family Shield deploys multi-layered security protocols with end-to-end encryption. Every component operates under strict compliance standards.',
    'howItWorks.steps.define.title': 'Activate',
    'howItWorks.steps.define.description': 'Your Family Shield stands vigilant with graduated access permissions. The system monitors discretely and activates precisely when needed.',

    // Values - Family Shield principles
    'values.title': 'Core Operating Principles',
    'values.subtitle': 'Strategic foundations that govern every aspect of your Family Shield deployment.',
    'values.empathy.title': 'Professional Competence',
    'values.empathy.description': 'Your family protection requires expertise, not sympathy. Sofia delivers authoritative guidance with the precision your legacy demands.',
    'values.security.title': 'Operational Security',
    'values.security.description': 'Your Family Shield operates under military-grade protocols with end-to-end encryption and international compliance standards. Security is not optional.',
    'values.automation.title': 'Systematic Intelligence',
    'values.automation.description': 'Complex succession planning becomes manageable through precision-engineered workflows. Sophisticated automation handles complexity while maintaining control.',
    'values.legacy.title': 'Legacy Continuity',
    'values.legacy.description': 'Your Family Shield ensures seamless transfer of wisdom and resources. Protection that operates across generations with unwavering reliability.',
    'values.unity.title': 'Strategic Integration',
    'values.unity.description': 'Every component operates in perfect coordination to create comprehensive family protection. The whole system exceeds the sum of its parts.',

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

    // Final CTA - Executive Family Shield decision
    'finalCTA.sofia.message': 'Your family\'s protection requires precision, not perfection. Let\'s deploy your Family Shield with the expertise your legacy deserves.',
    'finalCTA.sofia.title': 'Senior Family Protection Advisor',
    'finalCTA.headline.line1': 'Your Family Shield',
    'finalCTA.headline.line2': 'Awaits Activation',
    'finalCTA.subtitle': 'Deploy comprehensive protection with military-grade security and legal precision. Your thoughtful preparation is a gift of peace of mind.',
    'finalCTA.buttons.primary': 'Configure Family Shield Now',
    'finalCTA.buttons.secondary': 'Verify Existing Setup',
    'finalCTA.trust.secure': 'Military-Grade Security',
    'finalCTA.trust.private': 'Privacy First',
    'finalCTA.trust.trusted': 'Legal Precision',
    'finalCTA.trust.instant': 'Instant Activation',
    'finalCTA.peace.message': 'Your Family Shield monitors discretely and activates precisely when needed. Each guardian receives exactly what they need to help, when they need it.',
    'finalCTA.scrollDown': 'Continue to Footer',

    // Navigation - Family Shield
    'nav.howItWorks': 'Shield Operations',
    'nav.values': 'Core Principles',
    'nav.security': 'Security',
    'nav.login': 'Access Control',
    'nav.getStarted': 'Deploy Shield',

    // Footer - Family Shield messaging
    'footer.description': 'Comprehensive Family Shield platform trusted by families across Europe. Military-grade security meets professional competence.',
    'footer.product.title': 'Family Shield',
    'footer.product.howItWorks': 'Shield Operations',
    'footer.product.security': 'Security Protocols',
    'footer.product.trustSeal': 'System Verification',
    'footer.product.getStarted': 'Deploy Shield',
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
            "Fragmented protection systems across jurisdictions",
            "Inefficient access control and permission management",
            "Operational security gaps in succession planning",
            "Complex legal compliance requirements and validation",
            "Inadequate monitoring and emergency response protocols",
            "Delayed deployment due to systematic uncertainty"
          ];
        }
        if (key === 'problemPromise.order.solutions') {
          return [
            "Integrated Family Shield with Sofia's strategic guidance",
            "Multi-jurisdiction compliance templates (SK, CZ, AT, DE, PL)",
            "End-to-end encryption with graduated access control",
            "Precision-engineered workflows simplify complex decisions",
            "Real-time validation ensures operational compliance",
            "System verification provides continuous operational confidence"
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