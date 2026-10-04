const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
  : '/oldmangotree-NEW';
const basePath = isGithubActions ? (process.env.NEXT_PUBLIC_BASE_PATH ?? repoName) : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isGithubActions
    ? {
        output: 'export',
        basePath: basePath,
        trailingSlash: true,
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    // Directly stream external CDN images (Blogger, Unsplash, YouTube) for maximum performance
    // Eliminates Node.js proxying bottleneck and prevents 10s server timeouts
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blogger.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.bp.blogspot.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  ...(!isGithubActions
    ? {
        async rewrites() {
          return [
            {
              source: '/magazine-archives',
              destination: '/magazine',
            },
            {
              source: '/app-podcasts',
              destination: '/podcasts',
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
