import type { NextConfig } from "next";

// Static export so `gpu serve` (a Python server) can serve the built UI at /. trailingSlash makes
// each route a directory with index.html, which StaticFiles(html=True) serves cleanly. `pnpm dev`
// is unaffected (export only applies to `next build`).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
