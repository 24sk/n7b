import type { Product } from './product'

export interface CartItem {
  /** Stripe Product.metadata.slug と一致 */
  slug: string
  name: string
  /** JPY 整数 (税込価格を想定) */
  priceJpy: number
  /** Stripe Price の tax_behavior === 'inclusive' か */
  taxIncluded: boolean
  /** 一覧表示用の代表画像 (1 枚目) */
  image?: string
  /** Checkout Session 作成時に使う Stripe Price ID */
  priceId: string
  quantity: number
}

export type CartSnapshotInput = Pick<
  Product,
  'slug' | 'name' | 'priceJpy' | 'taxIncluded' | 'priceId' | 'images'
>

/** 日本の消費税率 (内税方式で内訳表示にのみ使用) */
export const CONSUMPTION_TAX_RATE = 0.1
