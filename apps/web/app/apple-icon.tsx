import { ImageResponse } from 'next/og';

// Apple touch icon metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#0A0A0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Shield with lock symbol */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          fill="none"
        >
          {/* Outer ring */}
          <circle cx="70" cy="70" r="65" stroke="#22D3EE" strokeWidth="1" opacity="0.3" />
          
          {/* Shield */}
          <path
            d="M70 20L30 38V70C30 98 48 120 70 128C92 120 110 98 110 70V38L70 20Z"
            fill="url(#shieldGrad)"
          />
          
          {/* Shield inner */}
          <path
            d="M70 28L38 44V70C38 94 53 113 70 120C87 113 102 94 102 70V44L70 28Z"
            fill="#0A0A0F"
            opacity="0.75"
          />
          
          {/* Lock body */}
          <rect x="50" y="62" width="40" height="32" rx="4" fill="#22D3EE" />
          
          {/* Lock shackle */}
          <path
            d="M56 62V52C56 44.268 62.268 38 70 38C77.732 38 84 44.268 84 52V62"
            stroke="#22D3EE"
            strokeWidth="6"
            strokeLinecap="round"
          />
          
          {/* Keyhole */}
          <circle cx="70" cy="74" r="6" fill="#0A0A0F" />
          <rect x="67" y="74" width="6" height="12" rx="2" fill="#0A0A0F" />
          
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
