<script setup lang="ts">
import type { Product, ProductCategory } from '~~/shared/types/product'
import { PRODUCT_CATEGORY_LABEL } from '~~/shared/types/product'

const route = useRoute()
const router = useRouter()

const { data: products, pending, error } = await useFetch<Product[]>('/api/products', {
  default: () => [],
})

type Filter = ProductCategory | 'all'

const selectedCategory = computed<Filter>(() => {
  const c = route.query.category
  if (typeof c === 'string' && c in PRODUCT_CATEGORY_LABEL)
    return c as ProductCategory
  return 'all'
})

const availableCategories = computed<ProductCategory[]>(() => {
  const set = new Set<ProductCategory>()
  for (const p of products.value) set.add(p.category)
  return (Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[]).filter(c => set.has(c))
})

const filteredProducts = computed<Product[]>(() => {
  if (selectedCategory.value === 'all')
    return products.value
  return products.value.filter(p => p.category === selectedCategory.value)
})

function selectCategory(c: Filter) {
  router.replace({ query: c === 'all' ? {} : { category: c } })
}

usePageSeo({
  title: '拠点で生まれたもの',
  description: '南湖7丁目ベースで日々の制作や研究から生まれた N7B オリジナルプロダクトの一覧です。',
  path: '/shop',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="mb-10">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            Shop
          </p>
          <h1 class="mt-4 flex items-center gap-2 text-h1 font-bold text-neutral-900">
            <UIcon name="i-lucide-flag" class="size-6 text-teal-700" />
            拠点で生まれたもの
          </h1>
          <p class="mt-4 text-body leading-relaxed text-neutral-700">
            日々の制作や研究のなかから生まれた、N7B オリジナルのプロダクト。
            フィールドの体感や手ざわりを、カタチにしています。
          </p>
        </header>

        <div v-if="availableCategories.length > 1" class="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full px-4 py-1.5 text-caption font-medium transition-colors"
            :class="selectedCategory === 'all'
              ? 'bg-teal-700 text-white'
              : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'"
            @click="selectCategory('all')"
          >
            すべて
          </button>
          <button
            v-for="c in availableCategories"
            :key="c"
            type="button"
            class="rounded-full px-4 py-1.5 text-caption font-medium transition-colors"
            :class="selectedCategory === c
              ? 'bg-teal-700 text-white'
              : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'"
            @click="selectCategory(c)"
          >
            {{ PRODUCT_CATEGORY_LABEL[c] }}
          </button>
        </div>

        <div v-if="pending && !products.length" class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="i in 4" :key="i" class="flex flex-col">
            <USkeleton class="aspect-square w-full rounded-lg" />
            <USkeleton class="mt-4 h-4 w-3/4 rounded" />
            <USkeleton class="mt-2 h-3 w-full rounded" />
            <USkeleton class="mt-3 h-5 w-1/3 rounded" />
          </div>
        </div>

        <div v-else-if="error" class="rounded-md border border-error/30 bg-error/5 p-6 text-body text-error">
          プロダクトの取得に失敗しました。時間をおいて再度お試しください。
        </div>

        <div v-else-if="!products.length" class="rounded-md border border-neutral-300 bg-neutral-50 p-6 text-body text-neutral-700">
          まだプロダクトがありません。準備中ですので、もう少しお待ちください。
        </div>

        <div v-else-if="!filteredProducts.length" class="rounded-md border border-neutral-300 bg-neutral-50 p-6 text-body text-neutral-700">
          このカテゴリには、まだプロダクトがありません。
        </div>

        <ul v-else class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="product in filteredProducts" :key="product.id">
            <ShopProductCard :product="product" />
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
