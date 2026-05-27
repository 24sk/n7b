import type { ShippingSize } from '~~/shared/types/product'

/**
 * 配送地域 (Stripe Checkout の shipping_options に並べて顧客に選ばせる)
 *
 * Stripe Checkout は配送先住所による shipping_rate の自動切替をサポートしないため、
 * 都道府県別の料金差を反映したい場合は複数の選択肢を提示して顧客に自己申告で選ばせる方式を採る。
 */
export type ShippingRegion = 'mainland' | 'remote'

export interface ShippingRegionDef {
  id: ShippingRegion
  /** Stripe Checkout 上の表示名 */
  displayName: string
}

export const SHIPPING_REGIONS: readonly ShippingRegionDef[] = [
  { id: 'mainland', displayName: 'ヤマト宅急便 (本州・四国・九州)' },
  { id: 'remote', displayName: 'ヤマト宅急便 (北海道・沖縄)' },
] as const

/**
 * ヤマト宅急便の規格サイズ × 地域別 料金テーブル (JPY)
 *
 * 仮値。実際の運用料金が確定したら本テーブルを更新する。
 */
const SHIPPING_RATE_TABLE: Record<ShippingSize, Record<ShippingRegion, number>> = {
  60: { mainland: 900, remote: 1400 },
  80: { mainland: 1100, remote: 1600 },
  100: { mainland: 1400, remote: 1900 },
  120: { mainland: 1700, remote: 2300 },
  140: { mainland: 2000, remote: 2600 },
  160: { mainland: 2200, remote: 2800 },
}

/**
 * カート内アイテムから請求対象の配送サイズを決める。
 * 同梱前提で「最大サイズに合わせる」方式 (mixed cart は最も大きい荷物のサイズを採用)。
 */
export function resolveBillingShippingSize(sizes: ShippingSize[]): ShippingSize {
  if (sizes.length === 0)
    return 60
  return sizes.reduce<ShippingSize>((max, s) => (s > max ? s : max), 60)
}

/**
 * Stripe Checkout Session の shipping_options に渡す配列を生成する。
 * 配送先地域ごとに 1 option を並べ、顧客が選択する。
 *
 * 戻り値の型は Stripe SDK 22.x の型エクスポート不備
 * (Stripe.Checkout.SessionCreateParams が namespace ではなく type alias で再 export されている) を避けるため、
 * `as const` で構造を保持し、呼び出し側で stripe.checkout.sessions.create に直接渡すことで SDK 側の引数型から検証される。
 */
export function buildShippingOptions(size: ShippingSize) {
  return SHIPPING_REGIONS.map(region => ({
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      display_name: region.displayName,
      fixed_amount: { amount: SHIPPING_RATE_TABLE[size][region.id], currency: 'jpy' },
      tax_behavior: 'inclusive' as const,
    },
  }))
}
