import type { CartItem, CartSnapshotInput } from '~~/shared/types/cart'
import { defineStore } from 'pinia'
import { CONSUMPTION_TAX_RATE } from '~~/shared/types/cart'

interface AddOptions {
  /** 加算するか上書きするか (デフォルト: 加算) */
  mode?: 'increment' | 'set'
  /**
   * 上限在庫数。指定すると要求数を `stock` で clamp し、超過時は useToast で警告を出す。
   * 未指定 (Notion 障害等で stock が不明) の場合は制約なし — checkout API 側で再検証する。
   */
  stock?: number
}

function notifyStockShortage(name: string, max: number) {
  const toast = useToast()
  toast.add({
    title: '在庫が不足しています',
    description: max <= 0
      ? `${name} は在庫切れです。`
      : `${name} は残り ${max} 個までです。`,
    color: 'warning',
    icon: 'i-lucide-alert-triangle',
  })
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),

  getters: {
    itemCount: state => state.items.reduce((sum, item) => sum + item.quantity, 0),
    isEmpty: state => state.items.length === 0,
    /** 税込小計 (= 合計、すべて内税表示のため) */
    subtotal: state => state.items.reduce((sum, item) => sum + item.priceJpy * item.quantity, 0),
  },

  actions: {
    /** 商品をカートに追加 (既存があれば数量を加算 / set 指定で上書き)。`stock` 指定で在庫上限を強制する */
    addItem(input: CartSnapshotInput, quantity = 1, options: AddOptions = {}) {
      if (quantity <= 0)
        return
      const existing = this.items.find(item => item.slug === input.slug)
      const requested = existing && options.mode !== 'set'
        ? existing.quantity + quantity
        : quantity

      const stock = options.stock
      let nextQuantity = requested
      if (typeof stock === 'number') {
        if (stock <= 0) {
          notifyStockShortage(input.name, 0)
          return
        }
        if (requested > stock) {
          notifyStockShortage(input.name, stock)
          nextQuantity = stock
        }
      }

      if (existing) {
        existing.quantity = nextQuantity
        return
      }
      this.items.push({
        slug: input.slug,
        name: input.name,
        priceJpy: input.priceJpy,
        taxIncluded: input.taxIncluded,
        image: input.images[0],
        priceId: input.priceId,
        quantity: nextQuantity,
      })
    },

    updateQuantity(slug: string, quantity: number, stock?: number) {
      const item = this.items.find(i => i.slug === slug)
      if (!item)
        return
      if (quantity <= 0) {
        this.removeItem(slug)
        return
      }
      if (typeof stock === 'number' && quantity > stock) {
        notifyStockShortage(item.name, stock)
        item.quantity = Math.max(stock, 1)
        return
      }
      item.quantity = quantity
    },

    removeItem(slug: string) {
      this.items = this.items.filter(item => item.slug !== slug)
    },

    clear() {
      this.items = []
    },

    /** localStorage からの復元用。形式が想定外なら無視する */
    hydrate(items: unknown) {
      if (!Array.isArray(items))
        return
      const valid: CartItem[] = []
      for (const raw of items) {
        if (!raw || typeof raw !== 'object')
          continue
        const r = raw as Record<string, unknown>
        if (
          typeof r.slug === 'string'
          && typeof r.name === 'string'
          && typeof r.priceJpy === 'number'
          && typeof r.taxIncluded === 'boolean'
          && typeof r.priceId === 'string'
          && typeof r.quantity === 'number'
          && r.quantity > 0
        ) {
          valid.push({
            slug: r.slug,
            name: r.name,
            priceJpy: r.priceJpy,
            taxIncluded: r.taxIncluded,
            image: typeof r.image === 'string' ? r.image : undefined,
            priceId: r.priceId,
            quantity: Math.floor(r.quantity),
          })
        }
      }
      this.items = valid
    },
  },
})

/** 内税方式の消費税額 (内訳表示用) */
export function calcInclusiveTax(subtotal: number, rate = CONSUMPTION_TAX_RATE): number {
  return Math.round(subtotal - subtotal / (1 + rate))
}
