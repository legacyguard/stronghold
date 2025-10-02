import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Terms of Service - Stronghold Will Generator',
  description: 'Terms of Service for Stronghold Will Generation platform. Learn about your rights and responsibilities when using our secure will creation service.',
  robots: 'index, follow',
  openGraph: {
    title: 'Terms of Service - Stronghold Will Generator',
    description: 'Terms of Service for Stronghold Will Generation platform.',
    type: 'website',
    locale: 'en_US',
  }
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-lg py-md flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-sm">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-h2 font-bold text-text-dark">Stronghold</span>
          </Link>

          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-lg py-2xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-text-dark mb-lg">Terms of Service</h1>

          <p className="text-gray-600 mb-xl">
            <strong>Last updated:</strong> December 2024
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-lg mb-xl">
            <h2 className="text-xl font-semibold text-primary mb-sm">Important Notice</h2>
            <p className="text-gray-700 mb-0">
              These Terms of Service govern your use of Stronghold&apos;s will generation platform.
              By using our service, you agree to these terms. Please read them carefully.
            </p>
          </div>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              By accessing or using Stronghold (&quot;Service&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
              you agree to be bound by these Terms of Service and our Privacy Policy.
              If you disagree with any part of these terms, you may not access the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              These terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              Stronghold provides a secure, AI-assisted platform for creating legally compliant
              wills across multiple jurisdictions (Slovakia, Czech Republic, Austria, Germany, and Poland).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-xs mb-md">
              <li>Guided will creation wizard</li>
              <li>Sofia AI assistance for legal guidance</li>
              <li>Trust Seal verification system</li>
              <li>Secure document storage and encryption</li>
              <li>Multi-device synchronization</li>
              <li>Legal template generation</li>
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">3. User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-xs mb-md">
              <li>Providing accurate and complete information</li>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>Complying with applicable laws in your jurisdiction</li>
              <li>Reviewing generated documents carefully before execution</li>
              <li>Seeking independent legal advice when necessary</li>
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">4. Legal Disclaimer</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-lg mb-md">
              <p className="text-gray-800 font-semibold mb-sm">
                ⚠️ Important Legal Notice
              </p>
              <p className="text-gray-700 leading-relaxed">
                Stronghold provides tools and templates for will creation but does not provide legal advice.
                The documents generated are for informational purposes and should be reviewed by qualified
                legal professionals in your jurisdiction before execution.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              We recommend consulting with licensed attorneys for complex estates,
              specific legal questions, or jurisdiction-specific requirements.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">5. Data Security and Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-xs mb-md">
              <li>End-to-end AES-256 encryption</li>
              <li>GDPR compliance for EU users</li>
              <li>Secure data centers with SOC 2 Type II certification</li>
              <li>Regular security audits and penetration testing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              For detailed information about data handling, please review our Privacy Policy.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">6. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              The Service and its original content, features, and functionality are owned by
              Stronghold and are protected by international copyright, trademark, and other laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You retain ownership of the content you create using our platform,
              including your will documents and personal information.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">7. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              To the fullest extent permitted by law, Stronghold shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages resulting from
              your use of the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our total liability shall not exceed the amount paid by you for the Service
              in the twelve months preceding the claim.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">8. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              We may terminate or suspend your account immediately, without prior notice,
              for any reason whatsoever, including breach of these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, your right to use the Service will cease immediately,
              but you may export your data within 30 days of termination.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of
              Slovakia, without regard to its conflict of law principles.
              Any disputes shall be resolved in the courts of Bratislava, Slovakia.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">10. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 rounded-xl p-lg">
              <ul className="text-gray-700 space-y-sm">
                <li><strong>Email:</strong> legal@stronghold.com</li>
                <li><strong>Support:</strong> support@stronghold.com</li>
                <li><strong>Address:</strong> Bratislava, Slovakia</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-xl">
            <p className="text-gray-500 text-sm text-center">
              These Terms of Service are effective as of December 2024 and will remain in effect
              except with respect to any changes in their provisions in the future.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-lg">
        <div className="max-w-4xl mx-auto px-lg text-center">
          <div className="flex justify-center space-x-lg text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition-colors duration-300">
              Home
            </Link>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors duration-300">
              Privacy Policy
            </Link>
            <a href="mailto:support@stronghold.com" className="hover:text-primary transition-colors duration-300">
              Contact
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-md">
            © 2024 Stronghold. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}