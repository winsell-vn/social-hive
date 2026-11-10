/** @type {import('next').NextConfig} */

// React's development build uses eval() to reconstruct component stacks when it
// reports errors/warnings. A strict CSP without 'unsafe-eval' blocks that and
// makes React log "eval() is not supported in this environment" in the browser
// console. Production never needs eval(), so the escape hatch is dev-only.
const isDevelopment = process.env.NODE_ENV !== 'production';

const nextConfig = {
  // Empty turbopack config to silence the webpack-only warning
  turbopack: {},
  // Standalone output for production deployment
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.chungtoixayweb.vn',
        pathname: '/uploads/**',
      },
    ],
  },
  // Proxy /uploads/* to backend server
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:4000';
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
  // HTTPS redirect - redirect all HTTP to HTTPS in production
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: `https://${process.env.NEXT_PUBLIC_DOMAIN || 'chungtoixayweb.vn'}/:path*`,
        permanent: true,
      },
    ];
  },
  // Security headers for SEO trust signals (T-125) + CSP
  async headers() {
    return [
      // Prevent CDN caching of auth pages - these must always serve fresh HTML
      // to avoid stale build artifact references after deployments
      ...['/login', '/register', '/forgot-password', '/reset-password'].map(path => ({
        source: path,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=0, must-revalidate',
          },
        ],
      })),
      // Also match Next.js route group pattern
      {
        source: '/(auth)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=0, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: https://www.google-analytics.com",
              "media-src 'self' data: blob:",
              `connect-src 'self' ${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000 ws://localhost:4000 '}https://gateway.chungtoixayweb.vn wss://gateway.chungtoixayweb.vn https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://cloudflareinsights.com`,
              "frame-src 'self' https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

