import { useCartStore } from '~/stores/cart'

const STORAGE_KEY = 'n7b:cart:v1'

export default defineNuxtPlugin(() => {
  const cart = useCartStore()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw)
      cart.hydrate(JSON.parse(raw))
  }
  catch {
    // localStorage 無効環境 / 破損データは無視
  }

  cart.$subscribe((_mutation, state) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    }
    catch {
      // QuotaExceeded など。サイレントに諦める
    }
  }, { detached: true })
})
