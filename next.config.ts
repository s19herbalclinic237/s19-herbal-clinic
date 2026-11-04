import path from "path";
import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Serve images exactly as stored instead of running them through Vercel's
    // Image Optimization API. On Hobby, Image Transformations are capped at
    // 5,000 per month; this site exceeded that, and each optimised request is
    // also extra origin traffic. The files in /public are already sized for the
    // slots they fill. If a future redesign needs resizing, use a custom loader
    // (Cloudinary/Unsplash) rather than re-enabling Vercel's optimiser.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // The Programs page was renamed to Services. Keep the old URL working for
      // bookmarks and search results with a permanent (308) redirect.
      { source: "/programs", destination: "/services", permanent: true },
      { source: "/programs/:path*", destination: "/services/:path*", permanent: true },
    ];
  },
};

export default nextConfig;