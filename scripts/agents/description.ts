/*
  Agent 5: 商品説明エージェント

  入力: 画像 + category + name
  出力: { description } (敬体, 50〜150 字)
*/
import type { Buffer } from 'node:buffer'
import type { Category, DescriptionOutput } from './shared'
import {
  BRAND_VOICE,
  DescriptionOutputSchema,
  getAnthropic,
  MODEL_ID,
  toImageBlocks,
  tryParseToolInput,
} from './shared'

const DESCRIPTION_GUIDE = `説明文ガイド:
- 敬体 (です・ます調)、50〜150 文字
- 構成: 製品の特徴 → 使用シーン → N7B の場所性 を 1〜2 文で
- 「拠点で生まれた」「南湖の海辺で」など場所性を匂わせる語彙を活かす
- 過度な販促表現 (「最高の」「至高の」「絶対に」など) は避ける
- 商品本体の素材・色・形状から読み取れる事実を起点にする`

const SYSTEM_PROMPT = `${BRAND_VOICE}

${DESCRIPTION_GUIDE}

商品画像・カテゴリ・商品名を受け取り、register_description ツールで説明文を返してください。`

export async function generateDescription(
  images: Buffer[],
  category: Category,
  name: string,
): Promise<DescriptionOutput> {
  const client = getAnthropic()
  const message = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: [{
      name: 'register_description',
      description: '商品説明文を登録',
      input_schema: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: '敬体で 50〜150 文字の商品説明',
          },
        },
        required: ['description'],
      },
    }],
    tool_choice: { type: 'tool', name: 'register_description' },
    messages: [{
      role: 'user',
      content: [
        ...toImageBlocks(images),
        {
          type: 'text' as const,
          text: `カテゴリ: ${category}\n商品名: ${name}\n\n商品説明を生成してください。`,
        },
      ],
    }],
  })

  const toolUse = message.content.find(c => c.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use')
    throw new Error('商品説明: Claude から tool_use が返されませんでした')

  return tryParseToolInput(toolUse.input, DescriptionOutputSchema, '商品説明エージェント')
}
