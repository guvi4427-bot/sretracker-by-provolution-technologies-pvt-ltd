import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel handles server output automatically - do NOT use output: "standalone" */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
