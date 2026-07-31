import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ output:'static', site: process.env.PUBLIC_SITE_URL || 'https://kuraberu-ikuji.pages.dev', integrations:[mdx(), sitemap()] });
