/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // optimizePackageImports: ['lucide-react'], // Comentado para evitar conflictos con Radix UI
  },
  images: {
    domains: ['images.unsplash.com'],
  },
};

module.exports = nextConfig;
