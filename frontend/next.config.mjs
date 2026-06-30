/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["unzipper"],
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
  reactStrictMode: false,
  experimental: {
    proxyClientMaxBodySize: "500mb",
  },
};

export default nextConfig;
