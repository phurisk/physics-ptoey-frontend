"use server"

const PORT = process.env.PORT ?? 3001

const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:3005";

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

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
