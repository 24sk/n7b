#!/usr/bin/env node
/*
  Stripe 商品マスタ登録スクリプト (冪等)

  - scripts/products/<slug>.json を読み、Stripe に Product / Price を作成または更新する
  - 既存判定: Product は metadata.slug、Price は lookup_key で照合
  - 環境変数:
      STRIPE_SECRET_KEY      (必須) test/live を切り替える主スイッチ
      NUXT_PUBLIC_SITE_URL   (任意) 既定 https://nango7base.jp

  実行: pnpm stripe:seed
*/
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import Stripe from 'stripe'
import { z } from 'zod'

const ROOT = resolve(import.meta.dirname, '..')
const PRODUCTS_DIR = join(ROOT, 'scripts/products')
const IMAGES_DIR = join(ROOT, 'public/images/products')
const BASE_URL = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://nango7base.jp'

export const ProductSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*$/, 'slug は kebab-case の英字'),
  name: z.string().min(1),
  description: z.string().min(1),
  priceJpy: z.number().int().positive(),
  category: z.enum(['tableware', 'lighting', 'stationery', 'apparel', 'craft', 'other']),
  storySlug: z.string().optional(),
  /** ヤマト宅急便規格 (送料計算に使用) */
  shippingSize: z.union([z.literal(60), z.literal(80), z.literal(100), z.literal(120), z.literal(140), z.literal(160)]),
  /** Notion 在庫管理 DB の初期在庫 (upsert 時は触らない。新規行のみ初期値として利用) */
  initialStock: z.number().int().nonnegative().default(1),
})
export type ProductConfig = z.infer<typeof ProductSchema>

const apiKey = process.env.STRIPE_SECRET_KEY
if (!apiKey) {
  console.error('✖ STRIPE_SECRET_KEY が未設定です')
  process.exit(1)
}

const stripe = new Stripe(apiKey)
const mode = apiKey.startsWith('sk_live_') ? 'LIVE' : 'TEST'
console.log(`Stripe ${mode} モードに登録します (BASE_URL=${BASE_URL})\n`)

function loadProducts(): ProductConfig[] {
  const files = readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json')).sort()
  return files.map((f) => {
    const raw = JSON.parse(readFileSync(join(PRODUCTS_DIR, f), 'utf8'))
    const parsed = ProductSchema.safeParse(raw)
    if (!parsed.success) {
      console.error(`✖ ${f} のスキーマ検証に失敗:`, parsed.error.flatten())
      process.exit(1)
    }
    // ファイル名と slug の不一致を検出
    const expectedSlug = f.replace(/\.json$/, '')
    if (parsed.data.slug !== expectedSlug) {
      console.error(`✖ ${f}: ファイル名と slug が不一致 (file=${expectedSlug}, json=${parsed.data.slug})`)
      process.exit(1)
    }
    return parsed.data
  })
}

function listImageUrls(slug: string): string[] {
  const dir = join(IMAGES_DIR, slug)
  try {
    if (!statSync(dir).isDirectory())
      return []
  }
  catch {
    return []
  }
  return readdirSync(dir)
    .filter(f => f.endsWith('.jpg'))
    .sort()
    .map(f => `${BASE_URL}/images/products/${slug}/${f}`)
}

async function findProductBySlug(slug: string): Promise<Stripe.Product | undefined> {
  // 件数が少ない想定 (~数十件) なので list で取得して metadata で絞り込む
  // (products.search はインデックス反映に遅延があり冪等運用に不向き)
  for await (const product of stripe.products.list({ limit: 100 })) {
    if (product.metadata.slug === slug)
      return product
  }
  return undefined
}

async function findPriceByLookupKey(lookupKey: string): Promise<Stripe.Price | undefined> {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })
  return res.data[0]
}

async function upsertProduct(p: ProductConfig): Promise<void> {
  const images = listImageUrls(p.slug)
  if (images.length === 0) {
    console.warn(`  ⚠ ${p.slug}: public/images/products/${p.slug}/*.jpg が見つかりません。先に pnpm images:optimize を実行してください`)
  }

  const metadata: Record<string, string> = {
    slug: p.slug,
    category: p.category,
    shipping_size: String(p.shippingSize),
  }
  if (p.storySlug)
    metadata.story_slug = p.storySlug

  const baseParams = {
    name: p.name,
    description: p.description,
    images,
    metadata,
  } satisfies Stripe.ProductUpdateParams

  const existing = await findProductBySlug(p.slug)
  const product = existing
    ? await stripe.products.update(existing.id, baseParams)
    : await stripe.products.create({
      ...baseParams,
      shippable: true,
      tax_code: 'txcd_99999999', // 一般物品 (Stripe Tax 用)
    })

  const existingPrice = await findPriceByLookupKey(p.slug)
  if (existingPrice) {
    if (existingPrice.unit_amount !== p.priceJpy) {
      console.warn(`  ⚠ ${p.slug}: 価格差異 (Stripe: ¥${existingPrice.unit_amount} / config: ¥${p.priceJpy}). 値上げ/値下げ時は手動で旧 Price を archive し、lookup_key を一旦外してから再実行してください`)
    }
    console.log(`  ✓ ${p.slug}  (Product=${product.id}, Price=${existingPrice.id})`)
  }
  else {
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.priceJpy,
      currency: 'jpy',
      tax_behavior: 'inclusive',
      lookup_key: p.slug,
    })
    await stripe.products.update(product.id, { default_price: price.id })
    console.log(`  ✓ ${p.slug}  (Product=${product.id}, Price=${price.id} [new])`)
  }

  await upsertInventoryRow(p, product.id)
}

// ─── Notion 在庫管理 DB 同期 ───────────────────────────
let notionClient: NotionClient | null = null
let inventoryDataSourceId: string | null = null

function getNotionInventory(): { notion: NotionClient, databaseId: string } | null {
  const apiToken = process.env.NOTION_API_TOKEN
  const databaseId = process.env.NOTION_INVENTORY_DB_ID
  if (!apiToken || !databaseId)
    return null
  if (!notionClient)
    notionClient = new NotionClient({ auth: apiToken })
  return { notion: notionClient, databaseId }
}

async function resolveInventoryDataSourceId(notion: NotionClient, databaseId: string): Promise<string> {
  if (inventoryDataSourceId)
    return inventoryDataSourceId
  const db = await notion.databases.retrieve({ database_id: databaseId })
  if (!('data_sources' in db) || !db.data_sources.length)
    throw new Error(`Notion inventory DB ${databaseId} has no data sources`)
  inventoryDataSourceId = db.data_sources[0]!.id
  return inventoryDataSourceId
}

/**
 * Notion 在庫管理 DB に slug キーで upsert。
 * - 既存行: `Stripe Product ID` と `商品名` のみ更新 (在庫数は触らない)
 * - 新規行: 全プロパティを作成し、`在庫数` / `初期在庫` の両方に `initialStock` を設定
 */
async function upsertInventoryRow(p: ProductConfig, stripeProductId: string): Promise<void> {
  const ni = getNotionInventory()
  if (!ni) {
    console.warn(`    └ Notion 在庫: NOTION_API_TOKEN または NOTION_INVENTORY_DB_ID が未設定のためスキップ`)
    return
  }
  const dataSourceId = await resolveInventoryDataSourceId(ni.notion, ni.databaseId)
  const found = await ni.notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
    filter: { property: 'Slug', title: { equals: p.slug } },
  })
  const page = found.results.find(isFullPage)
  if (page) {
    const properties: UpdatePageParameters['properties'] = {
      'Stripe Product ID': { rich_text: [{ text: { content: stripeProductId } }] },
      '商品名': { rich_text: [{ text: { content: p.name } }] },
    }
    await ni.notion.pages.update({ page_id: page.id, properties })
    console.log(`    └ Notion 在庫: ${p.slug} を更新 (在庫数は保持)`)
  }
  else {
    const properties: CreatePageParameters['properties'] = {
      'Slug': { title: [{ text: { content: p.slug } }] },
      'Stripe Product ID': { rich_text: [{ text: { content: stripeProductId } }] },
      '商品名': { rich_text: [{ text: { content: p.name } }] },
      'カテゴリ': { select: { name: p.category } },
      '在庫数': { number: p.initialStock },
      '初期在庫': { number: p.initialStock },
    }
    await ni.notion.pages.create({
      parent: { database_id: ni.databaseId },
      properties,
    })
    console.log(`    └ Notion 在庫: ${p.slug} を新規作成 (在庫数=${p.initialStock})`)
  }
}

const products = loadProducts()
if (products.length === 0) {
  console.log('scripts/products/*.json が空です。pnpm product:add で商品を追加してから再実行してください')
  process.exit(0)
}

for (const p of products) {
  await upsertProduct(p)
}
console.log(`\n完了: ${products.length} 商品を ${mode} に反映`)
