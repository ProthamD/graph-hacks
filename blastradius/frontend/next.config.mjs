/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server components to reach backend
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090'}/:path*`,
      },
    ];
  },
  // Transpile packages that use ESM
  transpilePackages: ['react-force-graph-2d', 'react-force-graph', 'react-force-graph-3d', 'three'],
};

export default nextConfig;
