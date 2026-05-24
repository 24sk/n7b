<script setup lang="ts">
interface Product {
  id: string
  name: string
  description: string
  price: number
  storyHref: string
  shopHref: string
  /** 画像差し替えまでの色味プレースホルダー */
  bg: string
}

const products: Product[] = [
  {
    id: 'mug',
    name: 'N7B モーニングマグ',
    description: '海辺の時間をイメージした、低めの太めシルエットのマグ。',
    price: 2200,
    storyHref: '/stories/mug',
    shopHref: '/shop/mug',
    bg: 'from-teal-100 via-teal-50 to-white',
  },
  {
    id: 'lantern',
    name: 'オリジナルランタン',
    description: 'フィールドの灯りとしてデザインしたランタン。',
    price: 6980,
    storyHref: '/stories/lantern',
    shopHref: '/shop/lantern',
    bg: 'from-accent-yellow/20 via-neutral-100 to-white',
  },
  {
    id: 'notebook',
    name: 'フィールドノート',
    description: '研究と記録を残すためのオリジナルノート。',
    price: 1650,
    storyHref: '/stories/notebook',
    shopHref: '/shop/notebook',
    bg: 'from-neutral-100 via-neutral-50 to-white',
  },
  {
    id: 'sticker',
    name: 'ステッカーセット',
    description: 'N7B のロゴと記号をあしらった4枚セット。',
    price: 880,
    storyHref: '/stories/sticker',
    shopHref: '/shop/sticker',
    bg: 'from-teal-50 via-white to-accent-yellow/10',
  },
  {
    id: 'tshirt',
    name: 'N7B キャンプリングシャツ',
    description: 'フィールドで快適に着られるグラフィックシャツ。',
    price: 3850,
    storyHref: '/stories/tshirt',
    shopHref: '/shop/tshirt',
    bg: 'from-neutral-100 via-teal-50 to-white',
  },
]

const jpy = new Intl.NumberFormat('ja-JP')
</script>

<template>
  <section class="bg-neutral-50">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-h2 font-bold text-neutral-900">
            <UIcon name="i-lucide-flag" class="size-5 text-teal-700" />
            拠点で生まれたもの
          </h2>
          <p class="mt-3 text-body text-neutral-700">
            日々の制作や研究のなかから生まれた、N7B オリジナルのプロダクト。<br>
            フィールドの体感や手ざわりを、カタチにしています。
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/shop"
            class="inline-flex items-center gap-1 text-caption font-medium text-teal-700 transition-colors hover:text-teal-800"
          >
            すべてのプロダクトを見る
            <UIcon name="i-lucide-chevron-right" class="size-3.5" />
          </NuxtLink>
          <div class="hidden gap-2 lg:flex">
            <UButton
              variant="outline"
              color="neutral"
              icon="i-lucide-chevron-left"
              size="sm"
              aria-label="前のプロダクト"
            />
            <UButton
              variant="outline"
              color="neutral"
              icon="i-lucide-chevron-right"
              size="sm"
              aria-label="次のプロダクト"
            />
          </div>
        </div>
      </header>

      <ul class="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        <li v-for="product in products" :key="product.id" class="group flex h-full flex-col">
          <NuxtLink :to="product.shopHref" class="block">
            <div
              class="aspect-square overflow-hidden rounded-lg bg-gradient-to-br" :class="[product.bg]"
            >
              <div class="flex h-full w-full items-center justify-center text-teal-700/40 transition-transform duration-300 group-hover:scale-105">
                <UIcon name="i-lucide-image" class="size-12" />
              </div>
            </div>
          </NuxtLink>

          <div class="mt-4 flex flex-1 flex-col space-y-2">
            <h3 class="text-body font-bold text-neutral-900">
              <NuxtLink :to="product.shopHref" class="transition-colors hover:text-teal-700">
                {{ product.name }}
              </NuxtLink>
            </h3>
            <p class="text-caption leading-relaxed text-neutral-700">
              {{ product.description }}
            </p>
            <p class="mt-auto pt-2 text-h3 font-bold text-neutral-900">
              ¥{{ jpy.format(product.price) }}
              <span class="text-caption font-normal text-neutral-500">(税込)</span>
            </p>
          </div>

          <div class="mt-3 space-y-2">
            <NuxtLink
              :to="product.storyHref"
              class="inline-flex items-center gap-1 text-caption font-medium text-teal-700 transition-colors hover:text-teal-800"
            >
              制作ストーリー
              <UIcon name="i-lucide-arrow-right" class="size-3" />
            </NuxtLink>
            <UButton
              variant="outline"
              color="primary"
              size="sm"
              block
              icon="i-lucide-shopping-bag"
            >
              カートに入れる
            </UButton>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
