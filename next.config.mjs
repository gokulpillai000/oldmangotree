const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
  : '/oldmangotree-NEW';
const basePath = isGithubActions ? (process.env.NEXT_PUBLIC_BASE_PATH ?? repoName) : '';

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
    unoptimized: true,
    remotePatterns: [
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
