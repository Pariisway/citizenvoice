/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: `next build` now produces plain HTML/CSS/JS in `out/`,
  // deployed via classic Firebase Hosting (`firebase deploy --only hosting`)
  // — no server, no Cloud Build, no App Hosting backend needed.
  output: "export",
  images: {
    // Static export has no server to run Next's image-optimization API on,
    // so this is required. We use plain <img> tags anyway, not next/image.
    unoptimized: true,
  },
};

module.exports = nextConfig;
