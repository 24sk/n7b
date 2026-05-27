import type { CartItem, CartSnapshotInput } from '~~/shared/types/cart'
import { defineStore } from 'pinia'
import { CONSUMPTION_TAX_RATE } from '~~/shared/types/cart'

interface AddOptions {
  /** 加算するか上書きするか (デフォルト: 加算) */
  mode?: 'increment' | 'set'
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
    /** 商品をカートに追加 (既存があれば数量を加算 / set 指定で上書き) */
    addItem(input: CartSnapshotInput, quantity = 1, options: AddOptions = {}) {
      if (quantity <= 0)
        return
      const existing = this.items.find(item => item.slug === input.slug)
      if (existing) {
        existing.quantity = options.mode === 'set' ? quantity : existing.quantity + quantity
        return
      }
      this.items.push({
        slug: input.slug,
        name: input.name,
        priceJpy: input.priceJpy,
        taxIncluded: input.taxIncluded,
        image: input.images[0],
        priceId: input.priceId,
        quantity,
      })
    },

    updateQuantity(slug: string, quantity: number) {
      const item = this.items.find(i => i.slug === slug)
      if (!item)
        return
      if (quantity <= 0) {
        this.removeItem(slug)
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
