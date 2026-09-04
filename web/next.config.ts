import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Dev is commonly opened on 127.0.0.1 as well as localhost. Without this,
  // Next treats 127.0.0.1 -> /_next/* as cross-origin and the HMR socket
  // fails, which the dev overlay reports as an opaque "[object Event]".
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default config;
