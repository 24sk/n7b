/*
  Agent 2: 背景合成エージェント

  - gpt-image-1 (OpenAI) で商品本体を保持しつつ背景と光のみ N7B トンマナに調整
  - 入力: PreparedImage[] (1024px 正規化済み)
  - 出力: PreparedImage[] (背景合成済み 1024px JPEG)
*/
import type OpenAI from 'openai'
import type { PreparedImage } from './image-prep'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { toFile } from 'openai'
import sharp from 'sharp'

const ENHANCE_SIZE = 1024

// 商品本体の見た目は触らず、背景と光のみを EC サイト向けに置き換えるプロンプト
const ENHANCE_PROMPT = `This is a product photo for an e-commerce listing on N7B (Nango7Base), a coastal "field lab and base camp" in Nango, Chigasaki, Japan.

YOUR TASK IS STRICTLY LIMITED TO: replacing the background and ambient environment around the product. Do NOT modify the product itself in any way.

PRESERVE EXACTLY (do not change any of these):
- The product's original colors, saturation, hue, brightness, and warmth — keep the exact tones from the input photo
- Materials, textures, stitching, knit/weave patterns, fabric details, surface finish
- Proportions, shape, scale, and any handmade imperfections or asymmetry
- Do NOT idealize, smooth, beautify, or "clean up" the product

REPLACE (this is what you should change):
- Background: replace with a clean, presentable e-commerce backdrop suitable for a product listing. Acceptable options: natural unfinished wood table, soft warm linen, neutral beige/cream surface, or pale sandy tone. Uncluttered, slightly out of focus.
- Ambient lighting: soft, even, natural light bright enough for clear product visibility. Should illuminate the product evenly without altering its colors.
- Add a subtle, natural soft shadow under the product for grounding.

OUTPUT: square 1:1 composition, product clearly centered.

STRICTLY AVOID:
- Any adjustment to the product's colors, saturation, hue, or warmth
- Stylizing, smoothing, or "improving" the product
- Pure white seamless studio backgrounds (too sterile for N7B mood)
- Vivid backgrounds, branded backdrops, text overlays, distracting props
- Harsh shadows, cold fluorescent tones, dramatic lighting, HDR effects, artistic filters`

async function enhanceOne(input: Buffer, openai: OpenAI): Promise<Buffer> {
  // 入力は既に 1024px JPEG だが gpt-image-1 は PNG 推奨のため再エンコード
  const pngBuf = await sharp(input)
    .resize(ENHANCE_SIZE, ENHANCE_SIZE, { fit: 'cover', position: 'attention' })
    .png()
    .toBuffer()

  const pngFile = await toFile(pngBuf, 'input.png', { type: 'image/png' })

  const result = await openai.images.edit({
    model: 'gpt-image-1',
    image: pngFile,
    prompt: ENHANCE_PROMPT,
    size: `${ENHANCE_SIZE}x${ENHANCE_SIZE}`,
    quality: 'medium',
    // input_fidelity: 'high' で商品の見た目をより忠実に保つ (色味の改変を抑える)
    input_fidelity: 'high',
    n: 1,
  })
  const b64 = result.data?.[0]?.b64_json
  if (!b64)
    throw new Error('gpt-image-1 が画像を返しませんでした')
  return sharp(Buffer.from(b64, 'base64')).jpeg({ quality: 95 }).toBuffer()
}

export async function enhanceImages(
  prepared: PreparedImage[],
  openai: OpenAI,
): Promise<PreparedImage[]> {
  const out: PreparedImage[] = []
  for (const [i, p] of prepared.entries()) {
    process.stdout.write(`  [${i + 1}/${prepared.length}] 合成中: ${p.originalName} ... `)
    const buf = await enhanceOne(p.buffer, openai)
    out.push({ originalName: p.originalName, buffer: buf })
    console.log('✓')
  }
  return out
}
