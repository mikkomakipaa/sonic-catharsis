/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16's Turbopack walks up from this directory looking for a
  // lockfile to infer the monorepo root, and finds an unrelated
  // package-lock.json at /Users/mikko.makipaa (outside this git repo),
  // misidentifying the project root. That silently breaks page discovery
  // (e.g. a PageNotFoundError for /api/matcher during `next build`). Pin
  // the root explicitly, as Next's own warning suggests, so it can't pick
  // up a lockfile from anywhere above this directory.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
