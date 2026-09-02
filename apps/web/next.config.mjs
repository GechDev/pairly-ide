/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pairly/contracts', '@pairly/database'],
};

export default nextConfig;
