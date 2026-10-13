// Single source of truth for deployment location. Override with env vars for a custom domain:
//   SITE_URL=https://example.com BASE_PATH=/ npm run build
export const siteUrl = (process.env.SITE_URL ?? 'https://sawyer-dev.github.io').replace(/\/+$/, '');

const rawBase = process.env.BASE_PATH ?? '/Sawyersite';
export const basePath =
  rawBase === '/' || rawBase === '' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
