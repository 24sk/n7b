import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    journal: defineCollection({
      type: 'page',
      source: 'journal/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        publishedAt: z.string(),
        category: z.enum(['制作', 'リサーチ', '雑記']),
        tags: z.array(z.string()).optional(),
        hero: z.string().optional(),
      }),
    }),
    stories: defineCollection({
      type: 'page',
      source: 'stories/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        productSlug: z.string(),
        hero: z.string().optional(),
        publishedAt: z.string(),
      }),
    }),
  },
})
