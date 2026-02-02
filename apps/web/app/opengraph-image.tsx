import { ImageResponse } from 'next/og';

// OG Image metadata
export const alt = 'PRVCSH - Your Privacy, Your Power';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0A0A0F 0%, #1A1A25 50%, #0A0A0F 100%)',
          padding: 60,
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(34,211,238,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Content container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Logo section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 320,
              height: 320,
              marginRight: 60,
            }}
          >
            <svg
              width="280"
              height="280"
              viewBox="0 0 280 280"
              fill="none"
            >
              {/* Outer ring */}
              <circle cx="140" cy="140" r="130" stroke="#22D3EE" strokeWidth="2" opacity="0.2" />
              
              {/* Shield */}
              <path
                d="M140 40L60 76V140C60 196 96 240 140 256C184 240 220 196 220 140V76L140 40Z"
                fill="url(#shieldGrad)"
              />
              
              {/* Shield inner */}
              <path
                d="M140 56L76 88V140C76 188 106 226 140 240C174 226 204 188 204 140V88L140 56Z"
                fill="#0A0A0F"
                opacity="0.75"
              />
              
              {/* Lock body */}
              <rect x="100" y="124" width="80" height="64" rx="8" fill="#22D3EE" />
              
              {/* Lock shackle */}
              <path
                d="M112 124V104C112 88.536 124.536 76 140 76C155.464 76 168 88.536 168 104V124"
                stroke="#22D3EE"
                strokeWidth="12"
                strokeLinecap="round"
              />
              
              {/* Keyhole */}
              <circle cx="140" cy="148" r="12" fill="#0A0A0F" />
              <rect x="134" y="148" width="12" height="24" rx="5" fill="#0A0A0F" />
              
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Text section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 80,
                fontWeight: 700,
                background: 'linear-gradient(90deg, #818CF8 0%, #22D3EE 50%, #A78BFA 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                marginBottom: 20,
              }}
            >
              PRVCSH
            </div>
            
            {/* Tagline */}
            <div
              style={{
                fontSize: 36,
                color: '#F5F5FA',
                marginBottom: 24,
              }}
            >
              Your Privacy, Your Power
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: 24,
                color: '#9CA3AF',
                marginBottom: 40,
              }}
            >
              Private transactions on Solana with zero-knowledge proofs
            </div>
            
            {/* Badges */}
            <div
              style={{
                display: 'flex',
                gap: 20,
              }}
            >
              {/* Solana badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  borderRadius: 24,
                  border: '1px solid #22D3EE',
                  background: 'rgba(34,211,238,0.1)',
                  color: '#22D3EE',
                  fontSize: 18,
                }}
              >
                ⚡ Powered by Solana
              </div>
              
              {/* ZK badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  borderRadius: 24,
                  border: '1px solid #A78BFA',
                  background: 'rgba(167,139,250,0.1)',
                  color: '#A78BFA',
                  fontSize: 18,
                }}
              >
                🔐 ZK-SNARK
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #818CF8 0%, #22D3EE 50%, #A78BFA 100%)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
