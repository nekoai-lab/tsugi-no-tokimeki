import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run デプロイ用: standalone モードで出力
  output: "standalone",

  // 画像最適化: Firebase Storage のドメインを許可
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9199',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9199',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
