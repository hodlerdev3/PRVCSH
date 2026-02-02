import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Generate PWA icons dynamically
 * 
 * Supports sizes: 192x192, 512x512
 * Supports types: regular, maskable
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const sizeParam = searchParams.get('size') || '512';
  const size = parseInt(sizeParam, 10);
  const maskable = searchParams.get('maskable') === 'true';
  
  // Maskable icons need safe zone (80% of icon)
  const iconSize = maskable ? size * 0.65 : size * 0.8;
  const offset = (size - iconSize) / 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: maskable 
            ? 'linear-gradient(135deg, #0A0A0F 0%, #1A1A25 100%)'
            : '#0A0A0F',
          borderRadius: maskable ? 0 : size * 0.2,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 280 280"
          fill="none"
          style={{
            marginTop: maskable ? offset * 0.1 : 0,
          }}
        >
          {/* Outer ring - only for non-maskable */}
          {!maskable && (
            <circle 
              cx="140" 
              cy="140" 
              r="130" 
              stroke="#22D3EE" 
              strokeWidth="2" 
              opacity="0.3" 
            />
          )}
          
          {/* Shield */}
          <path
            d="M140 20L50 60V140C50 204 90 254 140 272C190 254 230 204 230 140V60L140 20Z"
            fill="url(#shieldGrad)"
          />
          
          {/* Shield inner */}
          <path
            d="M140 40L68 72V140C68 192 102 236 140 252C178 236 212 192 212 140V72L140 40Z"
            fill="#0A0A0F"
            opacity="0.75"
          />
          
          {/* Lock body */}
          <rect x="100" y="115" width="80" height="70" rx="8" fill="#22D3EE" />
          
          {/* Lock shackle */}
          <path
            d="M112 115V92C112 76.536 124.536 64 140 64C155.464 64 168 76.536 168 92V115"
            stroke="#22D3EE"
            strokeWidth="14"
            strokeLinecap="round"
          />
          
          {/* Keyhole */}
          <circle cx="140" cy="142" r="14" fill="#0A0A0F" />
          <rect x="132" y="142" width="16" height="28" rx="6" fill="#0A0A0F" />
          
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
      width: size,
      height: size,
    }
  );
}
