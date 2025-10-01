import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Stronghold Will Generator';
  const description = searchParams.get('description') || 'Secure your family\'s future with AI-powered will generation';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 30% 20%, #6B8E23 0%, transparent 50%), radial-gradient(circle at 70% 80%, #6B8E23 0%, transparent 50%)',
          }}
        />

        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px',
            zIndex: 1,
            maxWidth: '1000px',
          }}
        >
          {/* Logo Area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#6B8E23',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '24px',
                boxShadow: '0 20px 40px rgba(107, 142, 35, 0.3)',
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  fontFamily: 'system-ui',
                }}
              >
                S
              </span>
            </div>
            <span
              style={{
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
                fontFamily: 'system-ui',
              }}
            >
              Stronghold
            </span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1.1,
              marginBottom: '32px',
              fontFamily: 'system-ui',
              textAlign: 'center',
            }}
          >
            {title}
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '32px',
              color: '#94a3b8',
              lineHeight: 1.4,
              marginBottom: '48px',
              fontFamily: 'system-ui',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            {description}
          </p>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '48px',
              marginBottom: '40px',
            }}
          >
            {[
              { icon: '🔒', text: '256-bit Encryption' },
              { icon: '⚡', text: '5 Jurisdictions' },
              { icon: '🤖', text: 'AI-Powered' },
              { icon: '✅', text: 'GDPR Compliant' },
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: '#6B8E23',
                }}
              >
                <span style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {feature.icon}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    fontFamily: 'system-ui',
                    color: '#e2e8f0',
                  }}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            style={{
              backgroundColor: '#6B8E23',
              padding: '20px 40px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(107, 142, 35, 0.4)',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'system-ui',
              }}
            >
              Start Your Will Today
            </span>
          </div>
        </div>

        {/* Sofia's Light */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            right: '15%',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #6B8E23 20%, #8fbc23 40%, transparent 70%)',
            opacity: 0.6,
            boxShadow: '0 0 100px rgba(107, 142, 35, 0.5)',
          }}
        />

        {/* Trust Indicators */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '24px',
            color: '#64748b',
            fontSize: '16px',
            fontFamily: 'system-ui',
          }}
        >
          <span>🏆 Legally Verified</span>
          <span>🌍 Multi-Jurisdiction</span>
          <span>👨‍⚖️ Expert Reviewed</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}