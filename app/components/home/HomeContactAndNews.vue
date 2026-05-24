<script setup lang="ts">
import type { NewsListItem } from '~~/shared/types/news'
import { formatNewsDate, isRecent, newsCategoryClass } from '~/utils/news'

const { data: news, pending } = await useFetch<NewsListItem[]>('/api/news', {
  default: () => [],
  transform: items => items.slice(0, 5),
})
</script>

<template>
  <section class="bg-neutral-50">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div class="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div class="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-sm lg:p-8">
          <div>
            <h2 class="text-h2 font-bold text-neutral-900">
              ものづくり・システム開発のご相談はこちら
            </h2>
            <p class="mt-3 text-body leading-relaxed text-neutral-700">
              制作・開発・コンテンツ企画など、N7B でお力になれそうなご相談を承っています。<br>
              個人・法人を問わず、お気軽にお問い合わせください。
            </p>
          </div>

          <div class="flex-1">
            <div class="flex aspect-[16/9] items-center justify-center rounded-md bg-gradient-to-br from-teal-100 via-neutral-100 to-accent-yellow/20">
              <UIcon name="i-lucide-image" class="size-12 text-teal-700/40" />
            </div>
          </div>

          <UButton
            to="/contact"
            color="primary"
            size="lg"
            trailing-icon="i-lucide-arrow-right"
            class="self-start rounded-md font-medium"
          >
            お仕事のご相談・お問い合わせ
          </UButton>
        </div>

        <div class="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-sm lg:p-8">
          <header class="flex items-end justify-between gap-4">
            <h2 class="text-h2 font-bold text-neutral-900">
              最新のお知らせ
            </h2>
            <NuxtLink
              to="/news"
              class="inline-flex items-center gap-1 text-caption font-medium text-teal-700 transition-colors hover:text-teal-800"
            >
              すべてのお知らせを見る
              <UIcon name="i-lucide-chevron-right" class="size-3.5" />
            </NuxtLink>
          </header>

          <div v-if="pending && !news.length" class="flex-1 space-y-2">
            <USkeleton v-for="i in 5" :key="i" class="h-10 w-full rounded" />
          </div>

          <div
            v-else-if="!news.length"
            class="flex-1 rounded-md border border-neutral-300 bg-neutral-50 p-6 text-body text-neutral-700"
          >
            まだお知らせはありません。次の更新まで、もう少しお待ちください。
          </div>

          <ul v-else class="flex-1 divide-y divide-neutral-100">
            <li v-for="item in news" :key="item.id">
              <NuxtLink
                :to="`/news/${item.slug}`"
                class="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 py-3 transition-colors hover:bg-neutral-50/50"
              >
                <time class="font-en text-caption text-neutral-500">
                  {{ formatNewsDate(item.publishedAt) }}
                </time>
                <span
                  class="inline-block rounded px-2 py-0.5 text-[10px] font-medium"
                  :class="[newsCategoryClass[item.category]]"
                >
                  {{ item.category }}
                </span>
                <span class="truncate text-body text-neutral-900">{{ item.title }}</span>
                <span
                  v-if="isRecent(item.publishedAt)"
                  class="rounded bg-badge-new px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  NEW
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
