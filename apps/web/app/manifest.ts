import type { MetadataRoute } from 'next';

/**
 * PWA Manifest
 * 
 * Web app manifest for Progressive Web App support.
 * Enables "Add to Home Screen" functionality on mobile devices.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PRVCSH - Solana Privacy Protocol',
    short_name: 'PRVCSH',
    description: 'Private transactions on Solana with zero-knowledge proofs. Shield your financial privacy with cutting-edge cryptography.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0F',
    theme_color: '#0A0A0F',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    dir: 'ltr',
    categories: ['finance', 'crypto', 'blockchain', 'privacy'],
    
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    
    screenshots: [
      {
        src: '/screenshots/desktop-home.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'PRVCSH Desktop Home',
      },
      {
        src: '/screenshots/mobile-home.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'PRVCSH Mobile Home',
      },
    ],
    
    shortcuts: [
      {
        name: 'Deposit',
        short_name: 'Deposit',
        description: 'Make a private deposit',
        url: '/?action=deposit',
        icons: [{ src: '/icons/deposit.png', sizes: '96x96' }],
      },
      {
        name: 'Withdraw',
        short_name: 'Withdraw',
        description: 'Make a private withdrawal',
        url: '/?action=withdraw',
        icons: [{ src: '/icons/withdraw.png', sizes: '96x96' }],
      },
    ],
    
    related_applications: [],
    prefer_related_applications: false,
  };
}
