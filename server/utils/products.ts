import type Stripe from 'stripe'
import type { Product, ProductCategory, ShippingSize } from '~~/shared/types/product'
import { PRODUCT_CATEGORIES, SHIPPING_SIZES } from '~~/shared/types/product'
import { fetchAllStock } from './notion-inventory'
import { useStripe } from './stripe'

/** Notion 接続不能時のフォールバック在庫数。SOLD OUT の誤検知を避けるため十分大きい値 */
const FALLBACK_STOCK = 9999

function normalizeCategory(value: string | undefined): ProductCategory {
  if (value && (PRODUCT_CATEGORIES as readonly string[]).includes(value))
    return value as ProductCategory
  return 'other'
}

function normalizeShippingSize(value: string | undefined): ShippingSize {
  const n = value ? Number.parseInt(value, 10) : Number.NaN
  if ((SHIPPING_SIZES as readonly number[]).includes(n))
    return n as ShippingSize
  // Stripe metadata 未設定 / 不正値時は最小サイズで安全側に倒す (送料は最小)
  return 60
}

function mapStripeProduct(p: Stripe.Product): Omit<Product, 'stock'> | null {
  const slug = p.metadata.slug
  if (!slug)
    return null
  const price = typeof p.default_price === 'object' && p.default_price !== null ? p.default_price : null
  if (!price || price.unit_amount == null)
    return null
  return {
    id: p.id,
    slug,
    name: p.name,
    description: p.description ?? '',
    images: p.images ?? [],
    category: normalizeCategory(p.metadata.category),
    storySlug: p.metadata.story_slug || undefined,
    priceJpy: price.unit_amount,
    taxIncluded: price.tax_behavior === 'inclusive',
    priceId: price.id,
    shippingSize: normalizeShippingSize(p.metadata.shipping_size),
  }
}

async function fetchAllFromStripe(): Promise<Product[]> {
  const stripe = useStripe()
  const base: Omit<Product, 'stock'>[] = []
  for await (const p of stripe.products.list({ active: true, limit: 100, expand: ['data.default_price'] })) {
    const mapped = mapStripeProduct(p)
    if (mapped)
      base.push(mapped)
  }

  // Notion 在庫 DB を 1 リクエストで取得して slug → stock の Map で join
  let stockMap: Map<string, number> | null = null
  try {
    const rows = await fetchAllStock()
    stockMap = new Map(rows.map(r => [r.slug, r.stock]))
  }
  catch (err) {
    // Notion 障害時は SOLD OUT 誤検知を避けるためフォールバックを使う (checkout 側で再検証する)
    console.error('[products] Notion 在庫取得失敗。fallback stock で続行', err)
  }

  const products: Product[] = base.map(p => ({
    ...p,
    // 行が見つかればその値、行なしは SOLD OUT (0)、Notion 接続不能時は FALLBACK_STOCK
    stock: stockMap ? (stockMap.get(p.slug) ?? 0) : FALLBACK_STOCK,
  }))

  return products.sort((a, b) => a.slug.localeCompare(b.slug))
}

// Stripe API への問い合わせを 10 分キャッシュ (一覧 / 詳細の両 API から共有)
export const listProducts: () => Promise<Product[]> = import.meta.dev
  ? fetchAllFromStripe
  : defineCachedFunction(fetchAllFromStripe, {
      maxAge: 60 * 10,
      staleMaxAge: 60 * 60,
      swr: true,
      name: 'products',
      getKey: () => 'all',
    })

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await listProducts()
  return all.find(p => p.slug === slug) ?? null
}
