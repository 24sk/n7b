#!/usr/bin/env node
/*
  AI 支援 商品追加スクリプト

  使い方:
    pnpm product:add <inbox-dir> <price-jpy>
    例: pnpm product:add assets-raw/inbox/new-thing 2200

  動作:
    1. 指定ディレクトリ内の画像 (HEIC 含む) を最大 4 枚 Claude に送信
    2. Claude が N7B のブランドトーンに沿って slug / 商品名 / 説明 / カテゴリを生成
    3. プレビュー表示 → ユーザー確認 (y/N)
    4. y の場合、続けて「画像を AI で N7B トンマナに調整しますか? [Y/n]」を質問
       - YES: gpt-image-1 で各画像を背景・光だけ N7B トーンに変換 (1 枚 ~¥6)
       - NO:  元画像のまま (HEIC は JPEG 化のみ)
    5. 画像を assets-raw/products/<slug>/ に保存
       → optimize-product-images.mjs → public/images/products/<slug>/
       → scripts/products/<slug>.json を出力
    6. 最後に "pnpm stripe:seed で反映してください" と案内

  環境変数:
    ANTHROPIC_API_KEY (必須)
    OPENAI_API_KEY    (任意: 画像 AI 調整を使う場合のみ必要)
*/
import { Buffer } from 'node:buffer'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import process from 'node:process'
import { createInterface, type Interface as ReadlineInterface } from 'node:readline/promises'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI, { toFile } from 'openai'
import sharp from 'sharp'
import { z } from 'zod'

const ROOT = resolve(import.meta.dirname, '..')
const PRODUCTS_JSON_DIR = join(ROOT, 'scripts/products')
const PRODUCTS_SRC_DIR = join(ROOT, 'assets-raw/products')

const IMAGE_EXT = /\.(?:jpe?g|png|webp|heic|heif)$/i
const MAX_IMAGES_FOR_AI = 4
const AI_IMAGE_SIZE = 1024
const ENHANCE_SIZE = 1024 // gpt-image-1 正方形 max
const CATEGORIES = ['tableware', 'lighting', 'stationery', 'apparel', 'other'] as const

// gpt-image-1 用プロンプト
// 方針: 商品本体 (色味・素材・形状) は触らず、背景のみ EC サイト向けに置き換える
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

const AiOutputSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1).max(40),
  description: z.string().min(20).max(200),
  category: z.enum(CATEGORIES),
})

// ─── 引数 ─────────────────────────────────────────────
const rawArgs = process.argv.slice(2)
const AUTO_YES = rawArgs.some(a => a === '--yes' || a === '-y')
const SKIP_ENHANCE = rawArgs.includes('--no-enhance')
const positional = rawArgs.filter(a => !a.startsWith('-'))
const [inboxArg, priceArg] = positional
if (!inboxArg || !priceArg) {
  console.error('使い方: pnpm product:add <inbox-dir> <price-jpy> [--yes] [--no-enhance]')
  console.error('  例: pnpm product:add assets-raw/inbox/new-thing 2200')
  console.error('  --yes (-y)     全プロンプトを自動で y にする (パイプ実行用)')
  console.error('  --no-enhance   画像 AI 調整をスキップ')
  process.exit(1)
}
const inboxDir = resolve(inboxArg)
const priceJpy = Number.parseInt(priceArg, 10)
if (!Number.isFinite(priceJpy) || priceJpy <= 0) {
  console.error('✖ price-jpy は正の整数で指定してください (例: 2200)')
  process.exit(1)
}
if (!existsSync(inboxDir)) {
  console.error(`✖ ディレクトリが存在しません: ${inboxDir}`)
  process.exit(1)
}

// ─── ヘルパ ───────────────────────────────────────────
function listExistingSlugs(): string[] {
  if (!existsSync(PRODUCTS_JSON_DIR))
    return []
  return readdirSync(PRODUCTS_JSON_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
}

function listInboxImages(): string[] {
  return readdirSync(inboxDir)
    .filter(f => !f.startsWith('.') && IMAGE_EXT.test(f))
    .sort()
}

async function prepareBase64Thumbnails(files: string[]): Promise<string[]> {
  return Promise.all(files.map(async (f) => {
    const buf = await sharp(join(inboxDir, f))
      .rotate()
      .resize(AI_IMAGE_SIZE, AI_IMAGE_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
    return buf.toString('base64')
  }))
}

async function enhanceImage(srcPath: string, dstPath: string, openai: OpenAI): Promise<void> {
  // gpt-image-1 入力用に 1024×1024 PNG に正規化 (HEIC/JPEG 兼用)
  const pngBuf = await sharp(srcPath)
    .rotate()
    .resize(ENHANCE_SIZE, ENHANCE_SIZE, { fit: 'cover', position: 'attention' })
    .png()
    .toBuffer()

  // OpenAI SDK の File-like ラッパで MIME を明示
  // (Buffer や ReadStream を直接渡すと application/octet-stream 扱いになり 400 を食らう)
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
  await sharp(Buffer.from(b64, 'base64')).jpeg({ quality: 95 }).toFile(dstPath)
}

async function processInbox(files: string[], slug: string, enhance: boolean, openai: OpenAI | null): Promise<void> {
  const targetDir = join(PRODUCTS_SRC_DIR, slug)
  mkdirSync(targetDir, { recursive: true })

  for (const [i, f] of files.entries()) {
    const src = join(inboxDir, f)
    const ext = extname(f).toLowerCase()
    const dst = join(targetDir, `${basename(f, ext)}.jpg`)

    if (enhance && openai) {
      process.stdout.write(`  [${i + 1}/${files.length}] AI 調整中: ${f} ... `)
      await enhanceImage(src, dst, openai)
      unlinkSync(src)
      console.log('✓')
    }
    else if (ext === '.heic' || ext === '.heif') {
      // HEIC は JPEG (q95) に変換しつつ移動
      await sharp(src).rotate().jpeg({ quality: 95 }).toFile(dst)
      unlinkSync(src)
    }
    else if (ext === '.jpg' || ext === '.jpeg') {
      renameSync(src, dst)
    }
    else {
      // png/webp も JPEG に正規化 (optimize スクリプトの入力統一)
      await sharp(src).rotate().jpeg({ quality: 95 }).toFile(dst)
      unlinkSync(src)
    }
  }

  // inbox が空なら削除 (他ファイルが残っていれば失敗 = 無視)
  try {
    rmdirSync(inboxDir)
  }
  catch { /* noop */ }
}

// 1 つの readline インスタンスをスクリプト全体で使い回す
// (毎回 close すると 2 回目以降の question() が hang するため)
const rl: ReadlineInterface = createInterface({ input: process.stdin, output: process.stdout })

async function confirm(question: string, defaultYes = false): Promise<boolean> {
  if (AUTO_YES) {
    process.stdout.write(`${question}y (auto)\n`)
    return true
  }
  const ans = (await rl.question(question)).trim()
  if (ans === '')
    return defaultYes
  return /^y(?:es)?$/i.test(ans)
}

// ─── Claude 呼び出し ──────────────────────────────────
async function generateProductInfo(base64Images: string[], existingSlugs: string[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('✖ ANTHROPIC_API_KEY が未設定です')
    process.exit(1)
  }
  const client = new Anthropic({ apiKey })

  const systemPrompt = `あなたは N7B (南湖7丁目ベース) の商品担当アシスタントです。
N7B は茅ヶ崎・南湖の海辺に位置する「ものづくり・記録・発信」の拠点です。

ブランドトーン:
- 自然体、落ち着き、温かみ、知的
- 過度にポップ・装飾過多・冷たい IT 感は避ける
- ランタンの灯り、手書きノート、海辺の砂、木のテーブルのような世界観
- 一人称は「N7B」または「南湖7丁目ベース」、敬体ベース
- 「拠点で生まれた」「南湖の海辺で」など場所性を感じさせる語彙を活かす

カテゴリ:
- tableware: マグ・皿・カトラリーなど食まわりの器
- lighting: ランタン・キャンドル・照明
- stationery: ノート・ペン・ステッカーなど文具
- apparel: Tシャツ・帽子など衣服
- other: 上記に当てはまらないもの

商品画像と価格を受け取り、register_product ツールで商品情報を返してください。`

  const existingNote = existingSlugs.length
    ? `\n\n既存 slug (重複禁止): ${existingSlugs.join(', ')}`
    : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    tools: [{
      name: 'register_product',
      description: '商品画像から N7B 商品情報を生成して登録',
      input_schema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            pattern: '^[a-z][a-z0-9-]*$',
            description: 'kebab-case 英字。3〜30 文字、英単語 2〜3 個を `-` で連結 (例: mug-nango7base, lantern-base-camp, notebook-field-log)',
          },
          name: {
            type: 'string',
            description: '日本語商品名 (8〜20 文字程度)。N7B らしい温かみのある名前 (例: 拠点マグカップ, 海辺のランタン, フィールドノート)',
          },
          description: {
            type: 'string',
            description: '日本語商品説明。敬体で 1〜2 文 (50〜150 文字)。製品の特徴と使用シーンを物語的に。N7B の文脈 (海・拠点・ものづくり) を自然に含める',
          },
          category: {
            type: 'string',
            enum: [...CATEGORIES],
            description: 'カテゴリ',
          },
        },
        required: ['slug', 'name', 'description', 'category'],
      },
    }],
    tool_choice: { type: 'tool', name: 'register_product' },
    messages: [{
      role: 'user',
      content: [
        ...base64Images.map(data => ({
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
        })),
        {
          type: 'text' as const,
          text: `価格: ¥${priceJpy.toLocaleString()} (税込)${existingNote}\n\n商品情報を生成してください。`,
        },
      ],
    }],
  })

  const toolUse = message.content.find(c => c.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    console.error('✖ Claude から tool_use が返されませんでした')
    process.exit(1)
  }

  const parsed = AiOutputSchema.safeParse(toolUse.input)
  if (!parsed.success) {
    console.error('✖ AI 出力のスキーマ検証に失敗:', parsed.error.flatten())
    process.exit(1)
  }
  return parsed.data
}

// ─── メイン ───────────────────────────────────────────
const allFiles = listInboxImages()
if (allFiles.length === 0) {
  console.error(`✖ ${inboxDir} に画像ファイルが見つかりません`)
  process.exit(1)
}

const sample = allFiles.slice(0, MAX_IMAGES_FOR_AI)
console.log(`画像 ${allFiles.length} 枚を検出 (うち ${sample.length} 枚を Claude に送信)\nClaude に問い合わせ中...\n`)

const existingSlugs = listExistingSlugs()
const base64Images = await prepareBase64Thumbnails(sample)
const aiResult = await generateProductInfo(base64Images, existingSlugs)

if (existingSlugs.includes(aiResult.slug)) {
  console.error(`✖ slug 重複: ${aiResult.slug}\n  既に scripts/products/${aiResult.slug}.json が存在します。再実行して別 slug を生成させるか、既存を削除してください`)
  process.exit(1)
}

const product = { ...aiResult, priceJpy }
console.log('AI が生成した商品情報:')
console.log(JSON.stringify(product, null, 2))
console.log('')

const ok = await confirm('この内容で登録しますか? [y/N]: ')
if (!ok) {
  console.log('キャンセルしました (画像は inbox に残っています)')
  process.exit(0)
}

// 画像 AI 調整の確認 (デフォルト Y、--no-enhance で強制 skip)
const enhance = SKIP_ENHANCE
  ? false
  : await confirm(`画像 ${allFiles.length} 枚を AI で N7B トンマナに調整しますか? (約 ¥${(allFiles.length * 6).toLocaleString()}) [Y/n]: `, true)

let openai: OpenAI | null = null
if (enhance) {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    console.error('✖ OPENAI_API_KEY が未設定です。.env に追加するか --no-enhance 相当で再実行してください')
    process.exit(1)
  }
  openai = new OpenAI({ apiKey: openaiKey })
}

// 画像を保存 (enhance=true なら gpt-image-1 で背景・光を N7B トーンに変換)
await processInbox(allFiles, aiResult.slug, enhance, openai)
console.log(`✓ ${allFiles.length} 枚を assets-raw/products/${aiResult.slug}/ に保存`)

// 最適化スクリプト実行
console.log('画像を最適化中...')
execSync('node scripts/optimize-product-images.mjs', { stdio: 'inherit', cwd: ROOT })

// JSON 書き出し
mkdirSync(PRODUCTS_JSON_DIR, { recursive: true })
const jsonPath = join(PRODUCTS_JSON_DIR, `${aiResult.slug}.json`)
writeFileSync(jsonPath, `${JSON.stringify(product, null, 2)}\n`)
console.log(`✓ scripts/products/${aiResult.slug}.json を作成`)

console.log('\n次のステップ: pnpm stripe:seed で Stripe に反映してください')

rl.close()
