import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://api-gateway:80/api/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
