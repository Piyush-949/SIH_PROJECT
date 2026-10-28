/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
    JWT_SECRET: process.env.JWT_SECRET,
    FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "socket.io", "jsonwebtoken"],
  },
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    // Handle Leaflet (browser-only library)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
