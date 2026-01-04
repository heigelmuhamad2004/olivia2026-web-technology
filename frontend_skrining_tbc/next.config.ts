import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",       // Folder output service worker
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // Matikan PWA saat mode dev biar nggak pusing cache
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  typescript: {
    // Ini membolehkan build sukses meski ada error TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ini membolehkan build sukses meski ada error ESLint
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);