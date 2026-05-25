import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    journal: defineCollection({
      type: 'page',
      source: 'journal/**/*.md',
      schema: z.object({
        title: z.string().describe('タイトル'),
        description: z.string().describe('概要 (一覧・SEO 説明文に使用)'),
        publishedAt: z.string().describe('公開日 (YYYY-MM-DD 形式)'),
        category: z.enum(['制作', 'リサーチ', '雑記']).describe('カテゴリ'),
        tags: z.array(z.string()).optional().describe('タグ (任意)'),
        hero: z.string().optional().describe('ヒーロー画像のパス (任意)'),
      }),
    }),
    stories: defineCollection({
      type: 'page',
      source: 'stories/**/*.md',
      schema: z.object({
        title: z.string().describe('タイトル'),
        description: z.string().describe('概要 (一覧・SEO 説明文に使用)'),
        productSlug: z.string().describe('紐づく Stripe 商品の slug'),
        hero: z.string().optional().describe('ヒーロー画像のパス (任意)'),
        publishedAt: z.string().describe('公開日 (YYYY-MM-DD 形式)'),
      }),
    }),
  },
})
