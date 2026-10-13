import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Site pages (About, Kanjectures, Talks, ...). The file name is the URL:
// `about.md` is the home page, `talks.md` is /talks.
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    // Browser tab / link-preview title. Defaults to "Kanjun Qiu ∙ <title>".
    pageTitle: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    // Which sidebar item to highlight.
    sidebarRow: z.number().default(1),
  }),
});

// Essays. An essay with `url` links out to another site; one without is
// written here and lives at /writing/<file name>.
const essays = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/essays' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    excerpt: z.string().optional(),
    ogImage: z.string().optional(),
    url: z.string().url().optional(),
    coauthor: z.string().optional(),
    coauthorUrl: z.string().url().optional(),
  }),
});

export const collections = { pages, essays };
