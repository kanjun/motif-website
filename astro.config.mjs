import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import { remarkSidenotes } from './src/plugins/remark-sidenotes.mjs';

export default defineConfig({
  integrations: [
    mdx(),
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [remarkSidenotes],
  },
  // Content folder is your Obsidian vault
  srcDir: './src',
});
