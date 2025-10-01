import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Privacy Policy - Stronghold Will Generator',
  description: 'Privacy Policy for Stronghold Will Generation platform. Learn how we protect your personal data and ensure GDPR compliance.',
  robots: 'index, follow',
  openGraph: {
    title: 'Privacy Policy - Stronghold Will Generator',
    description: 'Learn how Stronghold protects your personal data and ensures GDPR compliance.',
    type: 'website',
    locale: 'en_US',
  }
};

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold text-text-dark mb-lg">Privacy Policy</h1>

          <p className="text-gray-600 mb-xl">
            <strong>Last updated:</strong> December 2024
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-lg mb-xl">
            <h2 className="text-xl font-semibold text-green-800 mb-sm">🔒 Your Privacy is Our Priority</h2>
            <p className="text-green-700 mb-0">
              At Stronghold, we implement the highest standards of data protection and privacy.
              This policy explains how we collect, use, and safeguard your personal information.
            </p>
          </div>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-text-dark mb-sm">Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-md">
              We collect information you provide directly to us when using our will generation service:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-xs mb-md">
              <li>Name, address, and contact information</li>
              <li>Date of birth and citizenship details</li>
              <li>Information about beneficiaries and executors</li>
              <li>Asset and property information</li>
              <li>Account credentials and authentication data</li>
            </ul>

            <h3 className="text-xl font-semibold text-text-dark mb-sm">Technical Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-xs">
              <li>IP address and device identifiers</li>
              <li>Browser type and operating system</li>
              <li>Usage patterns and interaction data</li>
              <li>Performance and error logging data</li>
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              We use your information exclusively for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-xs mb-md">
              <li>Generating legally compliant will documents</li>
              <li>Providing Sofia AI assistance and guidance</li>
              <li>Creating and maintaining Trust Seals</li>
              <li>Ensuring platform security and preventing fraud</li>
              <li>Improving our services and user experience</li>
              <li>Complying with legal obligations</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-lg">
              <p className="text-blue-800 font-semibold mb-sm">
                ✅ We Never Sell Your Data
              </p>
              <p className="text-blue-700">
                Your personal information is never sold, rented, or shared with third parties
                for marketing purposes. Your data remains strictly confidential.
              </p>
            </div>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">3. Data Security Measures</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              We implement comprehensive security measures to protect your data:
            </p>

            <div className="grid md:grid-cols-2 gap-lg mb-md">
              <div className="bg-gray-50 rounded-xl p-lg">
                <h4 className="font-semibold text-text-dark mb-sm">🔐 Encryption</h4>
                <ul className="text-gray-700 text-sm space-y-xs">
                  <li>AES-256 end-to-end encryption</li>
                  <li>TLS 1.3 for data transmission</li>
                  <li>Encrypted database storage</li>
                  <li>Secure key management</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-lg">
                <h4 className="font-semibold text-text-dark mb-sm">🛡️ Access Control</h4>
                <ul className="text-gray-700 text-sm space-y-xs">
                  <li>Multi-factor authentication</li>
                  <li>Role-based access control</li>
                  <li>Regular access audits</li>
                  <li>Principle of least privilege</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-lg">
                <h4 className="font-semibold text-text-dark mb-sm">📊 Monitoring</h4>
                <ul className="text-gray-700 text-sm space-y-xs">
                  <li>24/7 security monitoring</li>
                  <li>Intrusion detection systems</li>
                  <li>Regular vulnerability scans</li>
                  <li>Incident response procedures</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-lg">
                <h4 className="font-semibold text-text-dark mb-sm">🏆 Certifications</h4>
                <ul className="text-gray-700 text-sm space-y-xs">
                  <li>SOC 2 Type II compliance</li>
                  <li>ISO 27001 standards</li>
                  <li>GDPR compliance</li>
                  <li>Regular security audits</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">4. GDPR Rights (EU Users)</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              If you're located in the European Union, you have the following rights:
            </p>

            <div className="space-y-md">
              <div className="border border-gray-200 rounded-xl p-lg">
                <h4 className="font-semibold text-text-dark mb-sm">Right to Access</h4>
                <p className="text-gray-700 text-sm">
                  Request a copy of all personal data we hold about you.
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-lg">
                <h4 className="font-semibold text-text-dark mb-sm">Right to Rectification</h4>
                <p className="text-gray-700 text-sm">
                  Correct any inaccurate or incomplete personal data.
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-lg">
                <h4 className="font-semibold text-text-dark mb-sm">Right to Erasure</h4>
                <p className="text-gray-700 text-sm">
                  Request deletion of your personal data under certain circumstances.
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-lg">
                <h4 className="font-semibold text-text-dark mb-sm">Right to Data Portability</h4>
                <p className="text-gray-700 text-sm">
                  Export your data in a structured, machine-readable format.
                </p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mt-md">
              To exercise these rights, contact us at <a href="mailto:privacy@stronghold.com" className="text-primary hover:text-primary-dark">privacy@stronghold.com</a>.
              We will respond within 30 days of your request.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              We retain your data only as long as necessary for the purposes outlined in this policy:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-xs mb-md">
              <li><strong>Will documents:</strong> Retained while your account is active plus 7 years after deletion</li>
              <li><strong>Account data:</strong> Retained while your account is active</li>
              <li><strong>Technical logs:</strong> Retained for 90 days for security purposes</li>
              <li><strong>Trust Seals:</strong> Retained permanently for verification purposes</li>
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">6. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              We use carefully selected third-party services to provide our platform:
            </p>

            <div className="grid md:grid-cols-2 gap-md">
              <div className="bg-gray-50 rounded-xl p-md">
                <h4 className="font-semibold text-text-dark mb-sm">Infrastructure</h4>
                <ul className="text-gray-700 text-sm space-y-xs">
                  <li>Vercel (hosting)</li>
                  <li>Supabase (database)</li>
                  <li>OpenAI (AI processing)</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-md">
                <h4 className="font-semibold text-text-dark mb-sm">Analytics</h4>
                <ul className="text-gray-700 text-sm space-y-xs">
                  <li>Privacy-focused analytics</li>
                  <li>No personal data sharing</li>
                  <li>Aggregated data only</li>
                </ul>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mt-md">
              All third-party services are bound by strict data processing agreements
              and GDPR compliance requirements.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">7. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              We use minimal, essential cookies to provide our service:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-xs mb-md">
              <li><strong>Essential cookies:</strong> Authentication and security</li>
              <li><strong>Functional cookies:</strong> Language preferences and settings</li>
              <li><strong>Analytics cookies:</strong> Anonymous usage statistics (with consent)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can manage cookie preferences in your browser settings.
              Essential cookies cannot be disabled as they're required for platform functionality.
            </p>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">8. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              Your data is primarily processed within the European Union.
              When data is transferred outside the EU, we ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-xs">
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Adequacy decisions by the European Commission</li>
              <li>Additional safeguards and certifications</li>
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">9. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-md">
              For privacy-related questions or to exercise your rights:
            </p>
            <div className="bg-gray-50 rounded-xl p-lg">
              <ul className="text-gray-700 space-y-sm">
                <li><strong>Privacy Officer:</strong> privacy@stronghold.com</li>
                <li><strong>Data Protection:</strong> dpo@stronghold.com</li>
                <li><strong>General Support:</strong> support@stronghold.com</li>
                <li><strong>Address:</strong> Bratislava, Slovakia</li>
              </ul>
            </div>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl font-bold text-text-dark mb-md">10. Updates to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy to reflect changes in our practices or legal requirements.
              We will notify you of any material changes via email or through our platform.
              The "Last updated" date at the top indicates when this policy was last modified.
            </p>
          </section>

          <div className="border-t border-gray-200 pt-xl">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-lg text-center">
              <h3 className="text-lg font-semibold text-primary mb-sm">Questions About Privacy?</h3>
              <p className="text-gray-700 mb-md">
                Our privacy team is here to help. Contact us anytime with questions or concerns.
              </p>
              <a
                href="mailto:privacy@stronghold.com"
                className="inline-flex items-center space-x-sm text-primary hover:text-primary-dark font-medium"
              >
                <span>privacy@stronghold.com</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
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
            <Link href="/terms-of-service" className="hover:text-primary transition-colors duration-300">
              Terms of Service
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