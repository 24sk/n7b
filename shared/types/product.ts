export type ProductCategory = 'tableware' | 'lighting' | 'stationery' | 'apparel' | 'craft' | 'other'

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  'tableware',
  'lighting',
  'stationery',
  'apparel',
  'craft',
  'other',
] as const

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  tableware: '食器',
  lighting: '照明',
  stationery: '文房具',
  apparel: 'アパレル',
  craft: 'クラフト',
  other: 'その他',
}

/** ヤマト宅急便の規格サイズ (3 辺合計 cm) */
export type ShippingSize = 60 | 80 | 100 | 120 | 140 | 160

export const SHIPPING_SIZES: readonly ShippingSize[] = [60, 80, 100, 120, 140, 160] as const

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
  /** ヤマト宅急便規格 (送料計算に使用) */
  shippingSize: ShippingSize
}
