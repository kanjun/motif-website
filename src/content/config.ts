import { defineCollection, z } from 'astro:content';

/**
 * Content Collections Configuration
 *
 * This defines the schema for your content folders.
 * Each folder in content/ can have its own collection with typed frontmatter.
 *
 * Your Obsidian vault structure:
 *   content/
 *     writing/     <- Blog posts / essays
 *     kanjectures/ <- Short ideas
 *     talks/       <- Talks and interviews
 */

const writingCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const kanjecturesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const talksCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    year: z.number().optional(),
    embedUrl: z.string().optional(),
    embedType: z.enum(['youtube', 'spotify', 'other']).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  writing: writingCollection,
  kanjectures: kanjecturesCollection,
  talks: talksCollection,
};
