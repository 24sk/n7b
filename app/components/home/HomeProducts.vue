<script setup lang="ts">
import type { Product } from '~~/shared/types/product'

const { data: products, pending, error } = await useFetch<Product[]>('/api/products', {
  default: () => [],
})

// トップページでは最大5件まで表示
const visibleProducts = computed(() => products.value.slice(0, 5))
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
        <NuxtLink
          to="/shop"
          class="inline-flex items-center gap-1 text-caption font-medium text-teal-700 transition-colors hover:text-teal-800"
        >
          すべてのプロダクトを見る
          <UIcon name="i-lucide-chevron-right" class="size-3.5" />
        </NuxtLink>
      </header>

      <div v-if="pending && !products.length" class="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        <div v-for="i in 5" :key="i" class="flex flex-col">
          <USkeleton class="aspect-square w-full rounded-lg" />
          <USkeleton class="mt-4 h-4 w-3/4 rounded" />
          <USkeleton class="mt-2 h-3 w-full rounded" />
          <USkeleton class="mt-3 h-5 w-1/3 rounded" />
        </div>
      </div>

      <div v-else-if="error" class="mt-10 rounded-md border border-error/30 bg-error/5 p-6 text-body text-error">
        プロダクトの取得に失敗しました。時間をおいて再度お試しください。
      </div>

      <div v-else-if="!visibleProducts.length" class="mt-10 rounded-md border border-neutral-300 bg-neutral-50 p-6 text-body text-neutral-700">
        まだプロダクトがありません。準備中ですので、もう少しお待ちください。
      </div>

      <ul v-else class="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        <li v-for="product in visibleProducts" :key="product.id">
          <ShopProductCard :product="product" />
        </li>
      </ul>
    </div>
  </section>
</template>
