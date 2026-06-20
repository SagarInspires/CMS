/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['isomorphic-dompurify'],
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === 'edge') {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        /jose\/dist\/webapi\/lib\/deflate\.js/
      ];
    }
    return config;
  },
  turbopack: {},
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};

export default nextConfig;
