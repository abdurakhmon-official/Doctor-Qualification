import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const apiHost = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;

  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' as const }),

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      ...(apiHost ? [{ protocol: 'https' as const, hostname: apiHost }] : []),
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
