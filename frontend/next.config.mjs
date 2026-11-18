/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: process.env.GITHUB_PAGES === "true" ? "/Socratic-OT" : "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
