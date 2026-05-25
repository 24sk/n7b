/*
  エージェント共通基盤

  - Anthropic / OpenAI クライアントの生成
  - N7B ブランドボイス (各 system prompt の冒頭で再利用)
  - Buffer[] を Claude image content blocks に変換するヘルパ
  - カテゴリ enum と Zod 型
*/
import type { Buffer } from 'node:buffer'
import process from 'node:process'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { z } from 'zod'

export const CATEGORIES = ['tableware', 'lighting', 'stationery', 'apparel', 'other'] as const
export type Category = (typeof CATEGORIES)[number]

export const CategorySchema = z.enum(CATEGORIES)

export const CATEGORY_GUIDE = `カテゴリ定義:
- tableware: マグ・皿・カトラリーなど食まわりの器
- lighting: ランタン・キャンドル・照明
- stationery: ノート・ペン・ステッカーなど文具
- apparel: Tシャツ・帽子など衣服
- other: 上記に当てはまらないもの`

export const BRAND_VOICE = `N7B (南湖7丁目ベース) は茅ヶ崎・南湖の海辺に位置する「ものづくり・記録・発信」の拠点です。

ブランドトーン:
- 自然体、落ち着き、温かみ、知的
- 過度にポップ・装飾過多・冷たい IT 感は避ける
- ランタンの灯り、手書きノート、海辺の砂、木のテーブルのような世界観
- 一人称は「N7B」または「南湖7丁目ベース」、敬体ベース
- 「拠点で生まれた」「南湖の海辺で」など場所性を感じさせる語彙を活かす`

export const MODEL_ID = 'claude-sonnet-4-6'

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('✖ ANTHROPIC_API_KEY が未設定です')
    process.exit(1)
  }
  return new Anthropic({ apiKey })
}

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('✖ OPENAI_API_KEY が未設定です。.env に追加するか --no-enhance で再実行してください')
    process.exit(1)
  }
  return new OpenAI({ apiKey })
}

export interface ImageBlock {
  type: 'image'
  source: { type: 'base64', media_type: 'image/jpeg', data: string }
}

export function toImageBlocks(buffers: Buffer[]): ImageBlock[] {
  return buffers.map(b => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg' as const,
      data: b.toString('base64'),
    },
  }))
}

// 各エージェント出力スキーマ
export const SlugSchema = z.string().regex(/^[a-z][a-z0-9-]*$/, 'slug は kebab-case の英字')

export const CategorizeOutputSchema = z.object({
  category: CategorySchema,
  reasoning: z.string().min(1).max(200),
})
export type CategorizeOutput = z.infer<typeof CategorizeOutputSchema>

export const NameOutputSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(1).max(40),
})
export type NameOutput = z.infer<typeof NameOutputSchema>

export const DescriptionOutputSchema = z.object({
  description: z.string().min(20).max(200),
})
export type DescriptionOutput = z.infer<typeof DescriptionOutputSchema>

export const PriceSuggestionSchema = z.object({
  min: z.number().int().positive(),
  recommended: z.number().int().positive(),
  max: z.number().int().positive(),
  rationale: z.string().min(1).max(300),
})
export type PriceSuggestion = z.infer<typeof PriceSuggestionSchema>

export interface ProductMetadata {
  slug: string
  name: string
  description: string
  category: Category
  priceJpy: number
}

export function tryParseToolInput<T>(
  toolInput: unknown,
  schema: z.ZodSchema<T>,
  agentName: string,
): T {
  const parsed = schema.safeParse(toolInput)
  if (!parsed.success) {
    console.error(`✖ ${agentName} 出力のスキーマ検証に失敗:`, parsed.error.flatten())
    process.exit(1)
  }
  return parsed.data
}
