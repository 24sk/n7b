/*
  Agent 6: 価格提案エージェント

  入力: 画像 + category + name + description + 既存商品の価格分布
  出力: { min, recommended, max, rationale }
*/
import type { Buffer } from 'node:buffer'
import type { Category, PriceSuggestion } from './shared'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BRAND_VOICE,
  getAnthropic,
  MODEL_ID,
  PriceSuggestionSchema,
  toImageBlocks,
  tryParseToolInput,
} from './shared'

const PRICE_GUIDE = `価格戦略ガイド:
- N7B は小ロット手仕事の拠点。安易な値下げや 100 円単位の半端な価格は避ける
- 通貨は税込み JPY 整数。10 円単位、できれば 100 円単位
- min < recommended < max の順序を守る
- 既存商品の価格分布 (カテゴリ別レンジ) を参考に、極端な外れ値にしない
- rationale は 1〜2 文 (50〜200 字)、根拠を簡潔に。市場相場の引用は避け、商品特性を語る`

interface ExistingProduct { category: Category, priceJpy: number }

function loadExistingProducts(productsJsonDir: string): ExistingProduct[] {
  if (!existsSync(productsJsonDir))
    return []
  return readdirSync(productsJsonDir)
    .filter(f => f.endsWith('.json'))
    .map((f) => {
      try {
        const raw = JSON.parse(readFileSync(join(productsJsonDir, f), 'utf8'))
        if (typeof raw?.priceJpy === 'number' && typeof raw?.category === 'string')
          return { category: raw.category as Category, priceJpy: raw.priceJpy }
        return null
      }
      catch {
        return null
      }
    })
    .filter((p): p is ExistingProduct => p !== null)
}

function formatDistribution(products: ExistingProduct[]): string {
  if (products.length === 0)
    return '(既存商品はまだありません)'
  const byCategory = new Map<Category, number[]>()
  for (const p of products) {
    const arr = byCategory.get(p.category) ?? []
    arr.push(p.priceJpy)
    byCategory.set(p.category, arr)
  }
  const lines: string[] = []
  for (const [cat, prices] of byCategory) {
    const sorted = [...prices].sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    lines.push(`- ${cat}: ${prices.length}件, ¥${min.toLocaleString()}〜¥${max.toLocaleString()}`)
  }
  return lines.join('\n')
}

const SYSTEM_PROMPT = `${BRAND_VOICE}

${PRICE_GUIDE}

商品画像と既存価格分布を参照し、suggest_price ツールで { min, recommended, max, rationale } を返してください。`

export async function suggestPrice(
  images: Buffer[],
  category: Category,
  name: string,
  description: string,
  productsJsonDir: string,
): Promise<PriceSuggestion> {
  const existing = loadExistingProducts(productsJsonDir)
  const distribution = formatDistribution(existing)

  const client = getAnthropic()
  const message = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: [{
      name: 'suggest_price',
      description: '推奨価格帯と根拠を提案',
      input_schema: {
        type: 'object',
        properties: {
          min: { type: 'integer', description: '最低価格 (税込 JPY 整数)' },
          recommended: { type: 'integer', description: '推奨価格 (税込 JPY 整数)' },
          max: { type: 'integer', description: '最高価格 (税込 JPY 整数)' },
          rationale: { type: 'string', description: '根拠 (1〜2 文、50〜200 字)' },
        },
        required: ['min', 'recommended', 'max', 'rationale'],
      },
    }],
    tool_choice: { type: 'tool', name: 'suggest_price' },
    messages: [{
      role: 'user',
      content: [
        ...toImageBlocks(images),
        {
          type: 'text' as const,
          text: `カテゴリ: ${category}\n商品名: ${name}\n説明: ${description}\n\n既存商品の価格分布:\n${distribution}\n\n推奨価格帯を提案してください。`,
        },
      ],
    }],
  })

  const toolUse = message.content.find(c => c.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use')
    throw new Error('価格提案: Claude から tool_use が返されませんでした')

  const result = tryParseToolInput(toolUse.input, PriceSuggestionSchema, '価格提案エージェント')
  if (!(result.min <= result.recommended && result.recommended <= result.max))
    throw new Error(`価格提案の順序が不正: min=${result.min}, rec=${result.recommended}, max=${result.max}`)
  return result
}
