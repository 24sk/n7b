/*
  Agent 3: カテゴリ分類エージェント

  画像からカテゴリ (tableware/lighting/stationery/apparel/other) と判定理由を生成。
*/
import type { Buffer } from 'node:buffer'
import type { CategorizeOutput } from './shared'
import {
  BRAND_VOICE,
  CATEGORIES,
  CategorizeOutputSchema,
  CATEGORY_GUIDE,
  getAnthropic,
  MODEL_ID,
  toImageBlocks,
  tryParseToolInput,
} from './shared'

const SYSTEM_PROMPT = `${BRAND_VOICE}

${CATEGORY_GUIDE}

商品画像を見て、最も適切なカテゴリを 1 つ選び、register_category ツールで返してください。
reasoning は 1〜2 文 (50〜120 字程度) で簡潔に。販促文ではなく、画像から読み取れる客観的な特徴を述べてください。`

export async function categorize(images: Buffer[]): Promise<CategorizeOutput> {
  const client = getAnthropic()

  const message = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: [{
      name: 'register_category',
      description: '画像からカテゴリと判定理由を登録',
      input_schema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: [...CATEGORIES],
            description: 'カテゴリ',
          },
          reasoning: {
            type: 'string',
            description: '判定理由 (1〜2 文、50〜120 字程度)',
          },
        },
        required: ['category', 'reasoning'],
      },
    }],
    tool_choice: { type: 'tool', name: 'register_category' },
    messages: [{
      role: 'user',
      content: [
        ...toImageBlocks(images),
        { type: 'text' as const, text: '商品画像です。カテゴリを判定してください。' },
      ],
    }],
  })

  const toolUse = message.content.find(c => c.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use')
    throw new Error('カテゴリ分類: Claude から tool_use が返されませんでした')

  return tryParseToolInput(toolUse.input, CategorizeOutputSchema, 'カテゴリ分類エージェント')
}
