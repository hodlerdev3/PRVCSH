import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: '#0A0A0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Shield with lock symbol */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 32 32"
          fill="none"
        >
          {/* Shield */}
          <path
            d="M16 4L6 8V15C6 21.075 10.25 26.575 16 28C21.75 26.575 26 21.075 26 15V8L16 4Z"
            fill="url(#grad)"
          />
          {/* Lock */}
          <rect x="12" y="14" width="8" height="7" rx="1" fill="#22D3EE" />
          <path
            d="M13 14V12C13 10.3431 14.3431 9 16 9C17.6569 9 19 10.3431 19 12V14"
            stroke="#22D3EE"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Keyhole */}
          <circle cx="16" cy="16.5" r="1.2" fill="#0A0A0F" />
          <rect x="15.4" y="16.5" width="1.2" height="2.5" rx="0.4" fill="#0A0A0F" />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
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
