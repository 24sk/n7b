/*
  Agent 4: 商品名エージェント

  入力: 画像 + category + 既存 slug 一覧
  出力: { name, slug }
  slug が既存と衝突した場合は 1 回だけ retry し、衝突回避を依頼する。
*/
import type { Buffer } from 'node:buffer'
import type { Category, NameOutput } from './shared'
import {
  BRAND_VOICE,
  getAnthropic,
  MODEL_ID,
  NameOutputSchema,
  toImageBlocks,
  tryParseToolInput,
} from './shared'

const NAMING_GUIDE = `命名ガイド:
- 商品名: 日本語 8〜20 文字程度
- 余韻のある名前を優先 (例: 「凪のうつわ」「南湖の朝ノート」「拠点ランタン」)
- 機能的すぎる名前 (例: 「白いマグ」「Tシャツ M サイズ」) は避ける
- N7B の場所性 (海・拠点・南湖) や手仕事感を匂わせる語を 1 つ含めると良い
- slug: kebab-case 英字、3〜30 文字、英単語 2〜3 個を - で連結 (例: nagi-no-utsuwa, morning-notebook)
- slug は商品名のローマ字/英訳/連想語で構成。日本語の音だけに引きずられない`

function buildSystemPrompt(): string {
  return `${BRAND_VOICE}

${NAMING_GUIDE}

商品画像とカテゴリを受け取り、N7B らしい商品名と slug を register_name ツールで返してください。`
}

function buildUserPrompt(category: Category, existingSlugs: string[], retryHint?: string): string {
  const collisionNote = existingSlugs.length
    ? `\n既存 slug (使用禁止): ${existingSlugs.join(', ')}`
    : ''
  const retryNote = retryHint ? `\n${retryHint}` : ''
  return `カテゴリ: ${category}${collisionNote}${retryNote}\n\n商品名と slug を生成してください。`
}

async function callOnce(
  images: Buffer[],
  category: Category,
  existingSlugs: string[],
  retryHint?: string,
): Promise<NameOutput> {
  const client = getAnthropic()
  const message = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 512,
    system: buildSystemPrompt(),
    tools: [{
      name: 'register_name',
      description: '商品名と slug を登録',
      input_schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '日本語商品名 (8〜20 文字程度)',
          },
          slug: {
            type: 'string',
            pattern: '^[a-z][a-z0-9-]*$',
            description: 'kebab-case 英字 (3〜30 文字)',
          },
        },
        required: ['name', 'slug'],
      },
    }],
    tool_choice: { type: 'tool', name: 'register_name' },
    messages: [{
      role: 'user',
      content: [
        ...toImageBlocks(images),
        { type: 'text' as const, text: buildUserPrompt(category, existingSlugs, retryHint) },
      ],
    }],
  })

  const toolUse = message.content.find(c => c.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use')
    throw new Error('商品名: Claude から tool_use が返されませんでした')

  return tryParseToolInput(toolUse.input, NameOutputSchema, '商品名エージェント')
}

export async function generateName(
  images: Buffer[],
  category: Category,
  existingSlugs: string[],
): Promise<NameOutput> {
  const first = await callOnce(images, category, existingSlugs)
  if (!existingSlugs.includes(first.slug))
    return first

  // 衝突 → 1 回だけ retry
  const retried = await callOnce(
    images,
    category,
    [...existingSlugs, first.slug],
    `直前の提案 "${first.slug}" は既存と衝突しました。別の slug を生成してください。`,
  )
  if (existingSlugs.includes(retried.slug) || retried.slug === first.slug)
    throw new Error(`slug 重複を解決できませんでした (試行: ${first.slug}, ${retried.slug})`)

  return retried
}
