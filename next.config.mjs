"use server"

const PORT = process.env.PORT ?? 3001

const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:3005";

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70, 80, 90],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.vercel.app" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
    domains: ["img.youtube.com", "i.ytimg.com"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "autoplay=*, fullscreen=*, picture-in-picture=*",
          },
        ],
      },
    ]
  },

  webpack(config, { isServer }) {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
    }

    if (isServer) {
      config.externals = [...(config.externals || []), "canvas"]
    }

    return config
  },

  async rewrites() {
    return [
      { source: "/api/reviews",       destination: `${API_PROXY_TARGET}/api/reviews` },
      { source: "/api/reviews/:path*",destination: `${API_PROXY_TARGET}/api/reviews/:path*` },

    ];
  },
};


export default nextConfig
