import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fimgs.net",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "server",
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);

// Note: To enable Sentry error tracking in production:
// 1. npm install @sentry/nextjs
// 2. Set NEXT_PUBLIC_SENTRY_DSN environment variable
// 3. Optionally run: npx @sentry/wizard@latest -i nextjs
// The errorReporting.ts utility will automatically use Sentry when available.
