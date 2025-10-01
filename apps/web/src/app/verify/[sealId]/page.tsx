// Public Trust Seal Verification Page
// Accessible URL: /verify/[sealId]

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TrustSealVerificationWidget } from '@/components/trust-seal/TrustSealVerificationWidget';
import { TrustSealVerifier } from '@/lib/trust-seal/verification';

interface PageProps {
  params: {
    sealId: string;
  };
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sealId } = params;

  // Validate seal ID format
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sealId);

  if (!isValidUUID) {
    return {
      title: 'Invalid Trust Seal ID - LegacyGuard',
      description: 'The provided Trust Seal ID is not valid.',
      robots: 'noindex, nofollow'
    };
  }

  // Try to get seal info for metadata (without logging verification)
  try {
    const verificationResult = await TrustSealVerifier.verifyTrustSeal(sealId, {
      includeMetadata: false,
      logVerification: false
    });

    if (verificationResult.valid) {
      return {
        title: `${verificationResult.level} Trust Seal Verification - LegacyGuard`,
        description: `Verify the authenticity of this ${verificationResult.level} level Trust Seal issued by LegacyGuard. Valid until ${verificationResult.validUntil?.toLocaleDateString('sk-SK')}.`,
        openGraph: {
          title: `${verificationResult.level} Trust Seal - LegacyGuard`,
          description: `Officially verified ${verificationResult.level} Trust Seal for legal document authenticity.`,
          type: 'website',
          url: `https://legacyguard.eu/verify/${sealId}`,
          images: [
            {
              url: `/api/og/trust-seal/${sealId}`,
              width: 1200,
              height: 630,
              alt: `${verificationResult.level} Trust Seal Certificate`
            }
          ]
        },
        twitter: {
          card: 'summary_large_image',
          title: `${verificationResult.level} Trust Seal - LegacyGuard`,
          description: `Verified ${verificationResult.level} Trust Seal for document authenticity.`,
          images: [`/api/og/trust-seal/${sealId}`]
        }
      };
    } else {
      return {
        title: 'Invalid Trust Seal - LegacyGuard',
        description: `This Trust Seal is not valid. Reason: ${verificationResult.reason}`,
        robots: 'noindex, nofollow'
      };
    }
  } catch (error) {
    return {
      title: 'Trust Seal Verification - LegacyGuard',
      description: 'Verify the authenticity and validity of LegacyGuard Trust Seals.',
      robots: 'noindex, nofollow'
    };
  }
}

export default async function TrustSealVerificationPage({ params }: PageProps) {
  const { sealId } = params;

  // Validate seal ID format
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sealId);

  if (!isValidUUID) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="LegacyGuard"
              className="h-8 w-8"
              onError={(e) => {
                // Fallback if logo doesn't exist
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LegacyGuard</h1>
              <p className="text-sm text-gray-600">Trust Seal Verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Trust Seal Verification
          </h2>
          <p className="text-lg text-gray-600">
            Overenie autenticity a platnosti Trust Seal certifikátu
          </p>
        </div>

        {/* Verification Widget */}
        <TrustSealVerificationWidget
          initialSealId={sealId}
          embedded={false}
          className="mb-8"
        />

        {/* Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-lg mb-3">🛡️ Čo je Trust Seal?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Trust Seal je digitálny certifikát, ktorý potvrdzuje autenticitu a kvalitu
              právnych dokumentov generovaných systémom LegacyGuard. Každý Trust Seal
              má jedinečné ID a možno ho verejne overiť.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-lg mb-3">🔍 Ako funguje overenie?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Overenie kontroluje platnosť digitálneho podpisu, dátum expirácie
              a autenticitu certifikátu. Všetky overenia sú zaznamenané pre audit,
              ale proces je anonymný a bezplatný.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-lg mb-3">📊 Úrovne Trust Seal</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                <span><strong>Bronze:</strong> Základná validácia</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <span><strong>Silver:</strong> Rozšírená validácia</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span><strong>Gold:</strong> Vysoká dôvera</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-400"></span>
                <span><strong>Platinum:</strong> Profesionálne overené</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-lg mb-3">⚖️ Právne upozornenie</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Trust Seal potvrdzuje iba technickú kvalitu a súlad s šablónami.
              Pre právnu platnosť dokumentu odporúčame konzultáciu s kvalifikovaným
              právnikom v príslušnej jurisdikcii.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center bg-blue-50 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            Potrebujete vytvoriť vlastný závet?
          </h3>
          <p className="text-blue-700 mb-4">
            LegacyGuard vám pomôže vytvoriť právne súladný závet s automatickým Trust Seal certifikátom.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Začať s LegacyGuard
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">LegacyGuard</h4>
              <p className="text-sm text-gray-400">
                Ochrana rodinného dedičstva pre budúce generácie.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Právne</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div>Podmienky používania</div>
                <div>Ochrana súkromia</div>
                <div>GDPR súlad</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Podpora</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div>Dokumentácia</div>
                <div>Kontakt</div>
                <div>FAQ</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
            © 2024 LegacyGuard. Všetky práva vyhradené.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Generate static params for known seal IDs (optional, for performance)
export async function generateStaticParams() {
  // In production, you might pre-generate pages for recently issued seals
  return [];
}