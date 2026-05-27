import type Stripe from 'stripe'
import type { Product, ProductCategory } from '~~/shared/types/product'
import { PRODUCT_CATEGORIES } from '~~/shared/types/product'
import { useStripe } from './stripe'

function normalizeCategory(value: string | undefined): ProductCategory {
  if (value && (PRODUCT_CATEGORIES as readonly string[]).includes(value))
    return value as ProductCategory
  return 'other'
}

function mapStripeProduct(p: Stripe.Product): Product | null {
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
  }
}

async function fetchAllFromStripe(): Promise<Product[]> {
  const stripe = useStripe()
  const products: Product[] = []
  for await (const p of stripe.products.list({ active: true, limit: 100, expand: ['data.default_price'] })) {
    const mapped = mapStripeProduct(p)
    if (mapped)
      products.push(mapped)
  }
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
