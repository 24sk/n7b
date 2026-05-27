#!/usr/bin/env node
/*
  AI 支援 商品追加スクリプト (エージェント分業版)

  使い方:
    pnpm product:add <inbox-dir> [<price-jpy>] [--yes] [--no-enhance]
    例: pnpm product:add assets-raw/inbox/new-thing
        pnpm product:add assets-raw/inbox/new-thing 2200

  動作:
    1. 画像準備エージェント       — HEIC/PNG/WebP → 1024px JPEG バッファに正規化
    2. 背景合成エージェント (任意) — gpt-image-1 で背景・光のみ N7B トーンに調整
    3. カテゴリ分類エージェント   — 画像からカテゴリ + 判定理由を生成
    4. 商品名エージェント         — 画像 + カテゴリから name + slug を生成 (重複時 retry)
    5. 商品説明エージェント       — 画像 + カテゴリ + name から 50〜150 字の説明を生成
    6. 価格提案エージェント       — 既存価格分布を参照し min/recommended/max を提案
    → CLI で全項目をプレビュー、価格は推奨値をデフォルトに上書き可
    → assets-raw/products/<slug>/ に保存 → optimize-product-images.mjs → scripts/products/<slug>.json
    → "pnpm stripe:seed で反映してください" と案内

  環境変数:
    ANTHROPIC_API_KEY (必須)
    OPENAI_API_KEY    (任意: 画像 AI 調整を使う場合のみ必要)
*/
import type { Interface as ReadlineInterface } from 'node:readline/promises'
import type { Category, ProductMetadata } from './agents/shared'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import { categorize } from './agents/categorize'
import { generateDescription } from './agents/description'
import { enhanceImages } from './agents/image-enhance'
import { commitToAssetsRaw, listInboxImages, MAX_IMAGES_FOR_AI, prepareImages } from './agents/image-prep'
import { generateName } from './agents/name'
import { suggestPrice } from './agents/price'
import { getOpenAI } from './agents/shared'

const ROOT = resolve(import.meta.dirname, '..')
const PRODUCTS_JSON_DIR = join(ROOT, 'scripts/products')
const PRODUCTS_SRC_DIR = join(ROOT, 'assets-raw/products')

// ─── 引数 ─────────────────────────────────────────────
const rawArgs = process.argv.slice(2)
const AUTO_YES = rawArgs.some(a => a === '--yes' || a === '-y')
const SKIP_ENHANCE = rawArgs.includes('--no-enhance')
const positional = rawArgs.filter(a => !a.startsWith('-'))
const [inboxArg, priceArg] = positional

if (!inboxArg) {
  console.error('使い方: pnpm product:add <inbox-dir> [<price-jpy>] [--yes] [--no-enhance]')
  console.error('  例: pnpm product:add assets-raw/inbox/new-thing')
  console.error('  <price-jpy>    省略時は価格提案エージェントの推奨値を採用')
  console.error('  --yes (-y)     全プロンプトを自動 yes (推奨価格を採用)')
  console.error('  --no-enhance   画像 AI 調整をスキップ')
  process.exit(1)
}
const inboxDir = resolve(inboxArg)
const overridePrice = priceArg != null ? Number.parseInt(priceArg, 10) : null
if (overridePrice != null && (!Number.isFinite(overridePrice) || overridePrice <= 0)) {
  console.error('✖ price-jpy は正の整数で指定してください (例: 2200)')
  process.exit(1)
}
if (!existsSync(inboxDir)) {
  console.error(`✖ ディレクトリが存在しません: ${inboxDir}`)
  process.exit(1)
}

// ─── readline ────────────────────────────────────────
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

async function askPrice(recommended: number, min: number, max: number): Promise<number> {
  if (AUTO_YES) {
    process.stdout.write(`価格 [Enter で確定 / 数値で上書き] (¥${recommended.toLocaleString()}): ${recommended} (auto)\n`)
    return recommended
  }
  while (true) {
    const ans = (await rl.question(
      `価格 [Enter で確定 / 数値で上書き] (¥${recommended.toLocaleString()}, 範囲 ¥${min.toLocaleString()}–¥${max.toLocaleString()}): `,
    )).trim()
    if (ans === '')
      return recommended
    const n = Number.parseInt(ans, 10)
    if (Number.isFinite(n) && n > 0)
      return n
    console.log('  ✖ 正の整数で入力してください')
  }
}

const SHIPPING_SIZE_VALUES: readonly ShippingSize[] = [60, 80, 100, 120, 140, 160] as const
async function askShippingSize(defaultSize: ShippingSize = 60): Promise<ShippingSize> {
  if (AUTO_YES) {
    process.stdout.write(`配送サイズ (60/80/100/120/140/160) [${defaultSize}]: ${defaultSize} (auto)\n`)
    return defaultSize
  }
  while (true) {
    const ans = (await rl.question(
      `配送サイズ (ヤマト宅急便規格: 60/80/100/120/140/160) [${defaultSize}]: `,
    )).trim()
    if (ans === '')
      return defaultSize
    const n = Number.parseInt(ans, 10) as ShippingSize
    if (SHIPPING_SIZE_VALUES.includes(n))
      return n
    console.log('  ✖ 60/80/100/120/140/160 のいずれかで入力してください')
  }
}

function listExistingSlugs(): string[] {
  if (!existsSync(PRODUCTS_JSON_DIR))
    return []
  return readdirSync(PRODUCTS_JSON_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
}

// ─── メイン ───────────────────────────────────────────
const allFiles = listInboxImages(inboxDir)
if (allFiles.length === 0) {
  console.error(`✖ ${inboxDir} に画像ファイルが見つかりません`)
  process.exit(1)
}
const sampled = allFiles.slice(0, MAX_IMAGES_FOR_AI)
console.log(`画像 ${allFiles.length} 枚を検出 (うち ${sampled.length} 枚をエージェントに送信)\n`)

// Step 1: 画像準備
process.stdout.write(`[1/6] 画像準備中… `)
let prepared = await prepareImages(inboxDir, sampled)
console.log(`✓ ${prepared.length} 枚を 1024px JPEG に正規化`)

// Step 2: 背景合成 (任意)
const enhance = SKIP_ENHANCE
  ? false
  : await confirm(
    `[2/6] 背景合成 (gpt-image-1, 約 ¥${(prepared.length * 6).toLocaleString()}) を実行しますか? [Y/n]: `,
    true,
  )
if (enhance) {
  const openai = getOpenAI()
  prepared = await enhanceImages(prepared, openai)
  console.log('       ✓ 背景合成完了')
}
else {
  console.log('       … 背景合成をスキップ')
}

// 各エージェントに渡す画像バッファ
const imageBuffers = prepared.map(p => p.buffer)

// Step 3: カテゴリ分類
process.stdout.write('[3/6] カテゴリ分類中… ')
const categoryResult = await categorize(imageBuffers)
console.log(`✓ ${categoryResult.category} (${categoryResult.reasoning})`)
const category: Category = categoryResult.category

// Step 4: 商品名
process.stdout.write('[4/6] 商品名生成中… ')
const existingSlugs = listExistingSlugs()
const nameResult = await generateName(imageBuffers, category, existingSlugs)
console.log(`✓ 「${nameResult.name}」 (slug: ${nameResult.slug})`)

// Step 5: 商品説明
process.stdout.write('[5/6] 商品説明生成中… ')
const descResult = await generateDescription(imageBuffers, category, nameResult.name)
console.log(`✓ ${descResult.description.slice(0, 40)}${descResult.description.length > 40 ? '…' : ''}`)

// Step 6: 価格提案
process.stdout.write('[6/6] 推奨価格を算出中… ')
const priceResult = await suggestPrice(
  imageBuffers,
  category,
  nameResult.name,
  descResult.description,
  PRODUCTS_JSON_DIR,
)
console.log(
  `✓ ¥${priceResult.recommended.toLocaleString()} `
  + `(範囲 ¥${priceResult.min.toLocaleString()}–¥${priceResult.max.toLocaleString()})`,
)
console.log(`       根拠: ${priceResult.rationale}`)

// ─── プレビュー & 確認 ───────────────────────────────
console.log('\n──── プレビュー ────')
console.log(`slug        : ${nameResult.slug}`)
console.log(`name        : ${nameResult.name}`)
console.log(`category    : ${category}`)
console.log(`description : ${descResult.description}`)
console.log(`price       : ¥${priceResult.recommended.toLocaleString()} (推奨)`)
console.log('────────────────────\n')

const priceJpy = overridePrice ?? await askPrice(priceResult.recommended, priceResult.min, priceResult.max)
const shippingSize = await askShippingSize()
const ok = await confirm('この内容で登録しますか? [Y/n]: ', true)
if (!ok) {
  console.log('キャンセルしました (画像は inbox に残っています)')
  rl.close()
  process.exit(0)
}

// ─── 確定 → 物理ファイル化 ───────────────────────────
const product: ProductMetadata = {
  slug: nameResult.slug,
  name: nameResult.name,
  description: descResult.description,
  category,
  priceJpy,
  shippingSize,
}

commitToAssetsRaw(prepared, PRODUCTS_SRC_DIR, product.slug, inboxDir)
console.log(`✓ ${prepared.length} 枚を assets-raw/products/${product.slug}/ に保存`)

// 最適化スクリプト実行
console.log('画像を最適化中...')
execSync('node scripts/optimize-product-images.mjs', { stdio: 'inherit', cwd: ROOT })

// JSON 書き出し
mkdirSync(PRODUCTS_JSON_DIR, { recursive: true })
const jsonPath = join(PRODUCTS_JSON_DIR, `${product.slug}.json`)
writeFileSync(jsonPath, `${JSON.stringify(product, null, 2)}\n`)
console.log(`✓ scripts/products/${product.slug}.json を作成`)

console.log('\n次のステップ: pnpm stripe:seed で Stripe に反映してください')

rl.close()
