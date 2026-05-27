<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { PRODUCT_CATEGORY_LABEL } from '~~/shared/types/product'
import { useCartStore } from '~/stores/cart'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: product } = await useFetch<Product>(() => `/api/products/${slug.value}`)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}

const activeImageIndex = ref(0)
const quantity = ref(1)
const jpy = new Intl.NumberFormat('ja-JP')

const cart = useCartStore()
const toast = useToast()

function addToCart() {
  if (!product.value)
    return
  cart.addItem(product.value, quantity.value)
  toast.add({
    title: 'カートに追加しました',
    description: `${product.value.name} × ${quantity.value}`,
    icon: 'i-lucide-check-circle-2',
    color: 'primary',
    actions: [
      { label: 'カートを見る', to: '/cart', color: 'primary', variant: 'outline' },
    ],
  })
  quantity.value = 1
}

usePageSeo({
  title: product.value.name,
  description: product.value.description,
  path: `/shop/${product.value.slug}`,
})
</script>

<template>
  <div v-if="product">
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <nav class="mb-8 text-caption text-neutral-500">
          <NuxtLink to="/shop" class="transition-colors hover:text-teal-700">
            拠点で生まれたもの
          </NuxtLink>
          <span class="mx-2">/</span>
          <span class="text-neutral-700">{{ product.name }}</span>
        </nav>

        <div class="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div class="space-y-4">
            <div class="aspect-square overflow-hidden rounded-lg bg-neutral-100">
              <NuxtImg
                v-if="product.images[activeImageIndex]"
                :src="product.images[activeImageIndex]"
                :alt="product.name"
                width="1200"
                height="1200"
                format="webp"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-teal-700/40">
                <UIcon name="i-lucide-image" class="size-16" />
              </div>
            </div>

            <ul v-if="product.images.length > 1" class="grid grid-cols-5 gap-2">
              <li v-for="(image, index) in product.images" :key="image">
                <button
                  type="button"
                  class="aspect-square w-full overflow-hidden rounded-md bg-neutral-100 transition-all"
                  :class="activeImageIndex === index
                    ? 'ring-2 ring-teal-700 ring-offset-2'
                    : 'opacity-70 hover:opacity-100'"
                  :aria-label="`画像 ${index + 1} を表示`"
                  @click="activeImageIndex = index"
                >
                  <NuxtImg
                    :src="image"
                    :alt="`${product.name} ${index + 1}`"
                    width="200"
                    height="200"
                    format="webp"
                    loading="lazy"
                    class="h-full w-full object-cover"
                  />
                </button>
              </li>
            </ul>
          </div>

          <div class="flex flex-col">
            <span class="inline-flex w-fit items-center rounded bg-teal-100 px-2 py-0.5 text-caption font-medium text-teal-700">
              {{ PRODUCT_CATEGORY_LABEL[product.category] }}
            </span>
            <h1 class="mt-4 text-h1 font-bold text-neutral-900">
              {{ product.name }}
            </h1>
            <p class="mt-6 text-body-lg leading-relaxed whitespace-pre-line text-neutral-700">
              {{ product.description }}
            </p>

            <p class="mt-8 text-h1 font-bold text-neutral-900">
              ¥{{ jpy.format(product.priceJpy) }}
              <span v-if="product.taxIncluded" class="text-body font-normal text-neutral-500">(税込)</span>
            </p>

            <div class="mt-8 space-y-3">
              <div class="flex items-center gap-3">
                <label class="text-caption font-medium text-neutral-700" :for="`qty-${product.slug}`">
                  数量
                </label>
                <div class="inline-flex items-center rounded-md border border-neutral-300">
                  <button
                    type="button"
                    class="flex size-9 items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="quantity <= 1"
                    aria-label="数量を1減らす"
                    @click="quantity = Math.max(1, quantity - 1)"
                  >
                    <UIcon name="i-lucide-minus" class="size-4" />
                  </button>
                  <input
                    :id="`qty-${product.slug}`"
                    v-model.number="quantity"
                    type="number"
                    min="1"
                    inputmode="numeric"
                    class="w-14 border-x border-neutral-300 bg-white py-1.5 text-center text-body text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    aria-label="数量"
                  >
                  <button
                    type="button"
                    class="flex size-9 items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-100"
                    aria-label="数量を1増やす"
                    @click="quantity = quantity + 1"
                  >
                    <UIcon name="i-lucide-plus" class="size-4" />
                  </button>
                </div>
              </div>
              <UButton
                color="primary"
                size="lg"
                block
                icon="i-lucide-shopping-bag"
                :disabled="quantity < 1"
                @click="addToCart"
              >
                カートに入れる
              </UButton>
            </div>

            <NuxtLink
              v-if="product.storySlug"
              :to="`/stories/${product.storySlug}`"
              class="mt-8 inline-flex items-center gap-1 text-caption font-medium text-teal-700 transition-colors hover:text-teal-800"
            >
              制作ストーリーを読む
              <UIcon name="i-lucide-arrow-right" class="size-3.5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
