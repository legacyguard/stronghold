import { Metadata } from 'next';
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: 'Stronghold Will Generator - Secure Your Family\'s Future with AI-Powered Legal Documents',
  description: 'Create legally compliant wills across 5 European jurisdictions (SK, CZ, AT, DE, PL) with Sofia AI guidance, military-grade security, and Trust Seal verification. Start your will today.',
  keywords: [
    'will generator',
    'testament online',
    'legal documents',
    'AI lawyer',
    'Slovakia will',
    'Czech will',
    'Austria will',
    'Germany will',
    'Poland will',
    'estate planning',
    'family protection',
    'legal compliance',
    'secure documents',
    'digital will',
    'inheritance planning'
  ],
  authors: [{ name: 'Stronghold Legal Tech' }],
  creator: 'Stronghold',
  publisher: 'Stronghold',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['sk_SK', 'cs_CZ'],
    url: 'https://stronghold.com',
    siteName: 'Stronghold Will Generator',
    title: 'Stronghold - Secure Your Family\'s Future with AI-Powered Will Generation',
    description: 'Create legally compliant wills across 5 European jurisdictions with Sofia AI guidance, military-grade security, and instant Trust Seal verification.',
    images: [
      {
        url: '/api/og?title=Secure Your Family\'s Future&description=AI-powered will generation across 5 jurisdictions',
        width: 1200,
        height: 630,
        alt: 'Stronghold Will Generator - Secure Family Legacy Protection',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stronghold - AI-Powered Will Generation for European Families',
    description: 'Create legally compliant wills with Sofia AI across SK, CZ, AT, DE, PL. Military-grade security meets compassionate guidance.',
    images: ['/api/og?title=Stronghold Will Generator&description=Secure your family\'s future with AI-powered legal documents'],
    creator: '@StrongholdLegal',
    site: '@StrongholdLegal',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: 'https://stronghold.com',
    languages: {
      'en': 'https://stronghold.com',
      'sk': 'https://stronghold.sk',
      'cs': 'https://stronghold.cz',
    },
  },
  category: 'Legal Technology',
  classification: 'Legal Services',
  other: {
    'application-name': 'Stronghold Will Generator',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'theme-color': '#6B8E23',
    'msapplication-TileColor': '#6B8E23',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function Home() {
  return <LandingPage />;
}