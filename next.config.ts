import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Public text files never change between deploys, so browsers and the CDN may reuse them.
  headers: () =>
    Promise.resolve([
      {
        source: '/(llms.txt|.well-known/security.txt)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ]),
};

export default nextConfig;
