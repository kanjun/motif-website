import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { existsSync, readdirSync } from 'node:fs';

// The preview (astro dev) can show a stand-in garden from folders that are
// never published (see .gitignore); a real build always uses the real notes.
const previewDir = (dir: string) =>
  import.meta.env.DEV && existsSync(dir) && readdirSync(dir).length > 0;
const gardenBase = previewDir('./src/content/garden-preview') ? './src/content/garden-preview' : './src/content/garden';
const historyBase = previewDir('./src/content/garden-history-preview')
  ? './src/content/garden-history-preview'
  : './src/content/garden-history';

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
    // Which sidebar item to highlight (from the old design; unused now).
    sidebarRow: z.number().default(1),
    // The About page opens with a small greeting above a large headline.
    greeting: z.string().optional(),
    headline: z.string().optional(),
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

// Garden notes. Written by the garden publisher from the public notes in the
// Obsidian vault: links are already resolved to /garden/<name>, and links to
// private notes are already plain text.
const garden = defineCollection({
  loader: glob({ pattern: '*.md', base: gardenBase }),
  schema: z.object({
    title: z.string(),
    created: z.coerce.date(),
    updated: z.coerce.date(),
    // Her order for the notes that were the Kanjectures on the old site.
    kanjecture: z.number().optional(),
  }),
});

// Every published version of each garden note, newest first.
const gardenHistory = defineCollection({
  loader: glob({ pattern: '*.json', base: historyBase }),
  schema: z.object({
    versions: z.array(z.object({ date: z.coerce.date(), text: z.string() })),
  }),
});

export const collections = { pages, essays, garden, gardenHistory };
