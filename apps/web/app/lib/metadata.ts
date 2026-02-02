/**
 * Metadata Configuration
 * 
 * Centralized metadata configuration for SEO, social sharing,
 * and PWA support. Used throughout the app for consistent branding.
 */

import type { Metadata, Viewport } from 'next';

// ============================================================================
// SITE CONFIGURATION
// ============================================================================

export const siteConfig = {
  name: 'PRVCSH',
  shortName: 'PRVCSH',
  description: 'Private transactions on Solana with zero-knowledge proofs. Shield your financial privacy with cutting-edge cryptography.',
  tagline: 'Your Privacy, Your Power',
  
  // URLs
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://privacycash.io',
  ogImage: '/og-image.png',
  twitterImage: '/twitter-card.png',
  
  // Branding
  themeColor: '#0A0A0F', // cipher-noir-charcoal
  accentColor: '#22D3EE', // cipher-noir-neon-cyan
  
  // Social
  twitter: '@PRVCSH',
  github: 'https://github.com/Privacy-Cash/prvcsh',
  
  // Team
  creator: 'PRVCSH Team',
  authors: [
    { name: 'PRVCSH Team', url: 'https://privacycash.io' },
  ],
  
  // Keywords for SEO
  keywords: [
    'Solana',
    'Privacy',
    'Zero Knowledge Proofs',
    'ZK-SNARK',
    'Cryptocurrency',
    'DeFi',
    'Mixer',
    'Private Transactions',
    'Blockchain Privacy',
    'Light Protocol',
    'Financial Privacy',
    'Web3',
    'Shielded Transactions',
    'Anonymity',
    'Crypto Privacy',
  ],
  
  // Categories
  category: 'Finance',
  applicationName: 'PRVCSH',
  
  // Verification (add when available)
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION,
} as const;

// ============================================================================
// DEFAULT METADATA
// ============================================================================

export const defaultMetadata: Metadata = {
  // Basic
  title: {
    default: `${siteConfig.name} | Solana Privacy Protocol`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [...siteConfig.authors],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,
  
  // Application
  applicationName: siteConfig.applicationName,
  category: siteConfig.category,
  
  // Robots
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
  
  // Icons (configured in layout, referenced here)
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: siteConfig.accentColor },
    ],
  },
  
  // Manifest
  manifest: '/manifest.json',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Solana Privacy Protocol`,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}${siteConfig.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - ${siteConfig.tagline}`,
        type: 'image/png',
      },
      {
        url: `${siteConfig.url}/og-square.png`,
        width: 600,
        height: 600,
        alt: `${siteConfig.name} Logo`,
        type: 'image/png',
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.twitter,
    creator: siteConfig.twitter,
    title: `${siteConfig.name} | Solana Privacy Protocol`,
    description: siteConfig.description,
    images: {
      url: `${siteConfig.url}${siteConfig.twitterImage}`,
      alt: `${siteConfig.name} - ${siteConfig.tagline}`,
    },
  },
  
  // Verification
  verification: {
    google: siteConfig.googleSiteVerification,
  },
  
  // Other
  alternates: {
    canonical: siteConfig.url,
  },
  
  // Format detection
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // Additional meta
  other: {
    'msapplication-TileColor': siteConfig.themeColor,
    'msapplication-config': '/browserconfig.xml',
  },
};

// ============================================================================
// VIEWPORT CONFIGURATION
// ============================================================================

export const defaultViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: siteConfig.themeColor },
    { media: '(prefers-color-scheme: light)', color: siteConfig.themeColor },
  ],
  colorScheme: 'dark',
};

// ============================================================================
// PAGE-SPECIFIC METADATA GENERATORS
// ============================================================================

/**
 * Generate metadata for a specific page
 */
export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const pageDescription = description || siteConfig.description;
  const pageImage = image || siteConfig.ogImage;
  
  return {
    title,
    description: pageDescription,
    
    robots: noIndex
      ? { index: false, follow: false }
      : defaultMetadata.robots,
    
    openGraph: {
      ...defaultMetadata.openGraph,
      title,
      description: pageDescription,
      url,
      images: [
        {
          url: pageImage.startsWith('http') ? pageImage : `${siteConfig.url}${pageImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    
    twitter: {
      ...defaultMetadata.twitter,
      title,
      description: pageDescription,
      images: {
        url: pageImage.startsWith('http') ? pageImage : `${siteConfig.url}${pageImage}`,
        alt: title,
      },
    },
    
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Generate JSON-LD structured data for Organization
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [
      siteConfig.github,
      `https://twitter.com/${siteConfig.twitter.replace('@', '')}`,
    ],
  };
}

/**
 * Generate JSON-LD structured data for WebApplication
 */
export function generateWebAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Private Transactions',
      'Zero-Knowledge Proofs',
      'Solana Blockchain',
      'Non-Custodial',
      'Open Source',
    ],
  };
}

/**
 * Generate JSON-LD structured data for SoftwareApplication (for PWA)
 */
export function generateSoftwareAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    permissions: 'Web3 Wallet Connection',
    softwareVersion: '1.0.0',
    author: {
      '@type': 'Organization',
      name: siteConfig.creator,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  siteConfig,
  defaultMetadata,
  defaultViewport,
  generatePageMetadata,
  generateOrganizationSchema,
  generateWebAppSchema,
  generateSoftwareAppSchema,
};
