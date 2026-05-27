export type ProductCategory = 'tableware' | 'lighting' | 'stationery' | 'apparel' | 'other'

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  'tableware',
  'lighting',
  'stationery',
  'apparel',
  'other',
] as const

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  tableware: '食器',
  lighting: '照明',
  stationery: '文房具',
  apparel: 'アパレル',
  other: 'その他',
}

export interface Product {
  /** Stripe Product ID (例: prod_xxx) */
  id: string
  /** ルーティング用 slug (Stripe Product.metadata.slug と Price.lookup_key と一致) */
  slug: string
  name: string
  description: string
  images: string[]
  category: ProductCategory
  /** 制作ストーリーへの紐付け (Phase 3 で使用) */
  storySlug?: string
  /** JPY 単位の整数価格 */
  priceJpy: number
  /** Stripe Price の tax_behavior === 'inclusive' か */
  taxIncluded: boolean
  /** Stripe Price ID (Checkout Session 作成に使用) */
  priceId: string
}
