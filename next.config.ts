import type { NextConfig } from "next";

// PREVIEW_EXPORT=1 produces a static `out/` folder for sharing design previews.
const isPreviewExport = process.env.PREVIEW_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isPreviewExport && {
    output: "export",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
