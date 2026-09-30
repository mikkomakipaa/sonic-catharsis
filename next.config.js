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
            // The legacy XSS auditor is gone from modern browsers and could
            // introduce XS-Leak side channels in old ones; '0' disables it
            // explicitly (current OWASP guidance). CSP below replaces it.
            key: 'X-XSS-Protection',
            value: '0'
          },
          {
            // Report-Only first (S4 in docs/CODE_AND_SECURITY_REVIEW_2026-09.md):
            // violations show in the browser console without breaking
            // anything. Switch the key to 'Content-Security-Policy' once a
            // production deploy runs clean. 'unsafe-inline' for scripts is
            // needed for Next's inline bootstrap without per-request nonces
            // (which would force dynamic rendering); for styles, by the
            // app's inline style={} usage. Fonts are self-hosted by
            // next/font; the receipt QR code is a data: URL.
            // va.vercel-scripts.com is Vercel Analytics' script origin in
            // development — production serves it from /_vercel on 'self'.
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self' https://va.vercel-scripts.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'"
            ].join('; ')
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
