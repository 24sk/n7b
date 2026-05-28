<script setup lang="ts">
import type { Product } from '~~/shared/types/product'

const props = defineProps<{
  product: Product
}>()

const jpy = new Intl.NumberFormat('ja-JP')
const isSoldOut = computed(() => props.product.stock <= 0)
</script>

<template>
  <article class="group flex h-full flex-col">
    <NuxtLink :to="`/shop/${product.slug}`" class="block">
      <div class="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        <NuxtImg
          v-if="product.images[0]"
          :src="product.images[0]"
          :alt="product.name"
          width="800"
          height="800"
          format="webp"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300"
          :class="isSoldOut ? '' : 'group-hover:scale-105'"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-teal-700/40">
          <UIcon name="i-lucide-image" class="size-12" />
        </div>
        <SoldOutBadge v-if="isSoldOut" size="card" />
      </div>
    </NuxtLink>

    <div class="mt-4 flex flex-1 flex-col space-y-2">
      <h3 class="text-body font-bold text-neutral-900">
        <NuxtLink :to="`/shop/${product.slug}`" class="transition-colors hover:text-teal-700">
          {{ product.name }}
        </NuxtLink>
      </h3>
      <p class="line-clamp-2 min-h-[2.8em] text-caption leading-relaxed text-neutral-700">
        {{ product.description }}
      </p>
      <p class="mt-auto pt-2 text-h3 font-bold text-neutral-900">
        ¥{{ jpy.format(product.priceJpy) }}
        <span v-if="product.taxIncluded" class="text-caption font-normal text-neutral-500">(税込)</span>
      </p>
    </div>

    <div class="mt-3 space-y-2">
      <NuxtLink
        v-if="product.storySlug"
        :to="`/stories/${product.storySlug}`"
        class="inline-flex items-center gap-1 text-caption font-medium text-teal-700 transition-colors hover:text-teal-800"
      >
        制作ストーリー
        <UIcon name="i-lucide-arrow-right" class="size-3" />
      </NuxtLink>
      <UButton
        :to="`/shop/${product.slug}`"
        variant="outline"
        color="primary"
        size="sm"
        block
        icon="i-lucide-shopping-bag"
      >
        詳細を見る
      </UButton>
    </div>
  </article>
</template>
