<script setup lang="ts">
import type { Product } from '~~/shared/types/product'
import { PRODUCT_CATEGORY_LABEL } from '~~/shared/types/product'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: product } = await useFetch<Product>(() => `/api/products/${slug.value}`)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}

const activeImageIndex = ref(0)
const jpy = new Intl.NumberFormat('ja-JP')

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
              <UButton
                color="primary"
                size="lg"
                block
                icon="i-lucide-shopping-bag"
                disabled
              >
                カートに入れる (準備中)
              </UButton>
              <p class="text-caption text-neutral-500">
                カート機能は現在準備中です。購入をご希望の方は<NuxtLink to="/contact" class="text-teal-700 hover:text-teal-800">
                  お問い合わせ
                </NuxtLink>よりご連絡ください。
              </p>
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
