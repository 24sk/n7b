<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { calcInclusiveTax, useCartStore } from '~/stores/cart'

const cart = useCartStore()
const toast = useToast()

const jpy = new Intl.NumberFormat('ja-JP')

const taxAmount = computed(() => calcInclusiveTax(cart.subtotal))

const checkoutPending = ref(false)

// 最新の在庫数を取得して SOLD OUT 判定する (カート内で完売した商品の決済を防ぐ)
// API 失敗時は stockBySlug が null → 不明扱いで決済を許可し、サーバ側 (2-22l) で再検証する
const { data: products } = await useFetch<Product[]>('/api/products')
const stockBySlug = computed(() => {
  if (!products.value)
    return null
  return new Map(products.value.map(p => [p.slug, p.stock]))
})
function isSoldOut(slug: string): boolean {
  if (!stockBySlug.value)
    return false
  const stock = stockBySlug.value.get(slug)
  // /api/products から消えている (archive 等) は SOLD OUT 扱い
  return stock === undefined ? true : stock <= 0
}
const hasSoldOutItem = computed(() => cart.items.some(item => isSoldOut(item.slug)))

function currentStock(slug: string): number | undefined {
  return stockBySlug.value?.get(slug)
}

function changeQuantity(slug: string, value: number) {
  cart.updateQuantity(slug, value, currentStock(slug))
}

function increment(slug: string, current: number) {
  cart.updateQuantity(slug, current + 1, currentStock(slug))
}

function decrement(slug: string, current: number) {
  cart.updateQuantity(slug, current - 1, currentStock(slug))
}

async function proceedToCheckout() {
  if (cart.isEmpty || checkoutPending.value)
    return
  checkoutPending.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/checkout', {
      method: 'POST',
      body: {
        items: cart.items.map(item => ({ slug: item.slug, quantity: item.quantity })),
      },
    })
    await navigateTo(url, { external: true })
  }
  catch (err) {
    console.error('[cart] checkout failed', err)
    toast.add({
      title: 'レジに進めませんでした',
      description: '時間をおいて再度お試しください。',
      color: 'error',
    })
    checkoutPending.value = false
  }
}

usePageSeo({
  title: 'カート',
  description: '南湖7丁目ベースのオンラインショップ・カートページ。',
  path: '/cart',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="mb-10">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            Cart
          </p>
          <h1 class="mt-4 flex items-center gap-2 text-h1 font-bold text-neutral-900">
            <UIcon name="i-lucide-shopping-bag" class="size-6 text-teal-700" />
            カート
          </h1>
        </header>

        <div
          v-if="cart.isEmpty"
          class="rounded-lg border border-neutral-300 bg-neutral-50 p-10 text-center"
        >
          <UIcon name="i-lucide-shopping-bag" class="mx-auto size-10 text-neutral-500" />
          <p class="mt-4 text-body text-neutral-700">
            カートに商品はまだありません。
          </p>
          <UButton
            to="/shop"
            color="primary"
            size="md"
            class="mt-6"
            icon="i-lucide-arrow-right"
          >
            拠点で生まれたものを見る
          </UButton>
        </div>

        <div v-else class="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <ul class="space-y-6 lg:col-span-2">
            <li
              v-for="item in cart.items"
              :key="item.slug"
              class="flex gap-4 border-b border-neutral-100 pb-6 sm:gap-6"
            >
              <NuxtLink
                :to="`/shop/${item.slug}`"
                class="relative block aspect-square w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:w-32"
              >
                <NuxtImg
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  width="200"
                  height="200"
                  format="webp"
                  loading="lazy"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-teal-700/40">
                  <UIcon name="i-lucide-image" class="size-8" />
                </div>
                <SoldOutBadge v-if="isSoldOut(item.slug)" size="card" />
              </NuxtLink>

              <div class="flex min-w-0 flex-1 flex-col">
                <h2 class="text-body font-bold text-neutral-900">
                  <NuxtLink :to="`/shop/${item.slug}`" class="transition-colors hover:text-teal-700">
                    {{ item.name }}
                  </NuxtLink>
                </h2>
                <p class="mt-1 text-caption text-neutral-700">
                  ¥{{ jpy.format(item.priceJpy) }}
                  <span v-if="item.taxIncluded" class="text-neutral-500">(税込)</span>
                </p>

                <div class="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div class="inline-flex items-center rounded-md border border-neutral-300">
                    <button
                      type="button"
                      class="flex size-8 items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                      :disabled="isSoldOut(item.slug) || item.quantity <= 1"
                      :aria-label="`${item.name} の数量を1減らす`"
                      @click="decrement(item.slug, item.quantity)"
                    >
                      <UIcon name="i-lucide-minus" class="size-4" />
                    </button>
                    <input
                      :value="item.quantity"
                      type="number"
                      min="1"
                      inputmode="numeric"
                      :disabled="isSoldOut(item.slug)"
                      class="w-12 border-x border-neutral-300 bg-white py-1 text-center text-caption text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-40"
                      :aria-label="`${item.name} の数量`"
                      @change="changeQuantity(item.slug, Number(($event.target as HTMLInputElement).value) || 0)"
                    >
                    <button
                      type="button"
                      class="flex size-8 items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                      :disabled="isSoldOut(item.slug)"
                      :aria-label="`${item.name} の数量を1増やす`"
                      @click="increment(item.slug, item.quantity)"
                    >
                      <UIcon name="i-lucide-plus" class="size-4" />
                    </button>
                  </div>

                  <p class="text-body font-bold text-neutral-900">
                    ¥{{ jpy.format(item.priceJpy * item.quantity) }}
                  </p>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1 text-caption text-neutral-500 transition-colors hover:text-error"
                    :aria-label="`${item.name} をカートから削除`"
                    @click="cart.removeItem(item.slug)"
                  >
                    <UIcon name="i-lucide-trash-2" class="size-3.5" />
                    削除
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <aside class="lg:col-span-1">
            <div class="sticky top-24 rounded-lg border border-neutral-100 bg-neutral-50 p-6">
              <h2 class="text-h3 font-bold text-neutral-900">
                ご注文の内訳
              </h2>

              <dl class="mt-6 space-y-3 text-body">
                <div class="flex justify-between text-neutral-700">
                  <dt>小計</dt>
                  <dd>¥{{ jpy.format(cart.subtotal) }}</dd>
                </div>
                <div class="flex justify-between text-neutral-500">
                  <dt>うち消費税 (10%)</dt>
                  <dd>¥{{ jpy.format(taxAmount) }}</dd>
                </div>
                <div class="flex justify-between text-neutral-500">
                  <dt>配送料</dt>
                  <dd>次の画面で計算</dd>
                </div>
                <div class="flex justify-between border-t border-neutral-300 pt-3 text-h3 font-bold text-neutral-900">
                  <dt>合計 (税込)</dt>
                  <dd>¥{{ jpy.format(cart.subtotal) }}</dd>
                </div>
              </dl>

              <UButton
                color="primary"
                size="lg"
                block
                class="mt-6"
                icon="i-lucide-credit-card"
                :loading="checkoutPending"
                :disabled="checkoutPending || hasSoldOutItem"
                @click="proceedToCheckout"
              >
                レジに進む
              </UButton>
              <p v-if="hasSoldOutItem" class="mt-3 text-caption text-error">
                在庫切れの商品があります。該当の商品をカートから削除してから決済に進んでください。
              </p>
              <p class="mt-3 text-caption text-neutral-500">
                クレジットカードまたはコンビニ決済でお支払いいただけます。配送料は次の画面で配送先地域に応じて選択できます。
              </p>

              <NuxtLink
                to="/shop"
                class="mt-6 inline-flex items-center gap-1 text-caption text-teal-700 transition-colors hover:text-teal-800"
              >
                <UIcon name="i-lucide-arrow-left" class="size-3.5" />
                買い物を続ける
              </NuxtLink>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>
