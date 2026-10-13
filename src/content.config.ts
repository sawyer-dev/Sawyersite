import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { appKeys } from './app-registry';

const contentLayout = z.enum(['article', 'wide', 'custom']).default('article');

const link = z.object({
  label: z.string().min(1),
  url: z.url(),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/[^_]*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        summary: z.string().min(20).max(240),
        /** Year completed or last meaningfully updated; drives newest-first ordering. */
        year: z.number().int().min(1990).max(2100),
        startYear: z.number().int().min(1990).max(2100).optional(),
        /** Tie-break for projects sharing a year (lower first). */
        order: z.number().int().default(0),
        status: z.enum(['complete', 'in-progress', 'archived']),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        categories: z.array(z.string()).default([]),
        technologies: z.array(z.string()).default([]),
        role: z.string().optional(),
        thumbnail: image().optional(),
        thumbnailAlt: z.string().optional(),
        links: z.array(link).default([]),
        contentLayout,
      })
      .refine((d) => !d.thumbnail || d.thumbnailAlt !== undefined, {
        message: 'thumbnailAlt is required when thumbnail is set (use "" for decorative images).',
        path: ['thumbnailAlt'],
      }),
});

const hobbies = defineCollection({
  loader: glob({ base: './src/content/hobbies', pattern: '**/[^_]*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        summary: z.string().min(20).max(240),
        status: z.enum(['current', 'historical']),
        started: z.number().int().min(1950).max(2100).optional(),
        updated: z.number().int().min(1950).max(2100).optional(),
        order: z.number().int().default(0),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        categories: z.array(z.string()).default([]),
        thumbnail: image().optional(),
        thumbnailAlt: z.string().optional(),
        contentLayout,
      })
      .refine((d) => !d.thumbnail || d.thumbnailAlt !== undefined, {
        message: 'thumbnailAlt is required when thumbnail is set (use "" for decorative images).',
        path: ['thumbnailAlt'],
      }),
});

const apps = defineCollection({
  loader: glob({ base: './src/content/apps', pattern: '**/[^_]*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        summary: z.string().min(20).max(240),
        status: z.enum(['prototype', 'experiment', 'stable', 'archived']),
        /** One line describing the main interaction, shown on the index card. */
        interaction: z.string().min(1),
        /** Key into src/app-registry/index.ts. */
        entryComponent: z.enum(appKeys),
        categories: z.array(z.string()).default([]),
        thumbnail: image().optional(),
        thumbnailAlt: z.string().optional(),
        sourceUrl: z.url().optional(),
        /** Honest known limitations, rendered on the detail page. */
        limitations: z.array(z.string()).default([]),
        updated: z.coerce.date(),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .refine((d) => !d.thumbnail || d.thumbnailAlt !== undefined, {
        message: 'thumbnailAlt is required when thumbnail is set (use "" for decorative images).',
        path: ['thumbnailAlt'],
      }),
});

export const collections = { projects, hobbies, apps };
