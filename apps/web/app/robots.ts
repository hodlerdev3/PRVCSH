import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://privacycash.io';

/**
 * Robots.txt Configuration
 * 
 * Allows all crawlers to index the site.
 * References sitemap for SEO optimization.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',          // Protect API routes
          '/_next/',        // Next.js internals
          '/private/',      // Any private routes
        ],
      },
      {
        // Googlebot specific rules
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        // Bingbot specific rules
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
