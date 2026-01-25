import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run デプロイ用: standalone モードで出力
  output: "standalone",
};

export default nextConfig;
