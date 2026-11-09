const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
let basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// Auto-detect GitHub Pages subpath (e.g. /oldmangotree) if deployed on github.io without custom domain
if (isGithubActions && !process.env.CUSTOM_DOMAIN && process.env.NEXT_PUBLIC_BASE_PATH === undefined) {
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (repo && !repo.endsWith('.github.io')) {
    basePath = `/${repo}`;
  }
}

const isProd = process.env.NODE_ENV === 'production';
const isExport = isProd || process.env.NEXT_EXPORT === 'true';

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  optimizeFonts: false,
  ...(isExport ? { output: 'export' } : {}),
  reactStrictMode: true,
  ...(basePath ? { basePath, trailingSlash: true } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Security headers are active when running Next.js runtime (dev / standalone / node)
  ...(!isExport
    ? {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: securityHeaders,
            },
          ];
        },
      }
    : {}),
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
};

export default nextConfig;
