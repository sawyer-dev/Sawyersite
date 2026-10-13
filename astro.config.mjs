// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { basePath, siteUrl } from './site.config.mjs';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  trailingSlash: 'always',
  compressHTML: true,
  integrations: [mdx(), react(), sitemap({ filter: (page) => !page.endsWith('/404/') })],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});
