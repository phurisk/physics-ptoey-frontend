"use server"

const PORT = process.env.PORT ?? 3001

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },


}

export default nextConfig