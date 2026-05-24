<script setup lang="ts">
import type { NewsDetail } from '~~/shared/types/news'
import { formatNewsDate, newsCategoryClass } from '~/utils/news'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: news, error } = await useFetch<NewsDetail>(() => `/api/news/${slug.value}`)

if (!news.value || error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'お知らせが見つかりませんでした',
    fatal: true,
  })
}

usePageSeo({
  title: news.value.title,
  description: news.value.title,
  path: `/news/${slug.value}`,
})
</script>

<template>
  <div v-if="news">
    <article class="bg-white">
      <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="mb-8 border-b border-neutral-100 pb-8">
          <div class="flex flex-wrap items-center gap-3">
            <time class="font-en text-caption text-neutral-500">
              {{ formatNewsDate(news.publishedAt) }}
            </time>
            <span
              class="inline-block rounded px-2 py-0.5 text-[10px] font-medium"
              :class="[newsCategoryClass[news.category]]"
            >
              {{ news.category }}
            </span>
          </div>
          <h1 class="mt-4 text-h1 font-bold text-neutral-900">
            {{ news.title }}
          </h1>
        </header>

        <NewsBlocks :blocks="news.blocks" />

        <div class="mt-12 border-t border-neutral-100 pt-8">
          <NuxtLink
            to="/news"
            class="inline-flex items-center gap-1 text-body font-medium text-teal-700 transition-colors hover:text-teal-800"
          >
            <UIcon name="i-lucide-chevron-left" class="size-4" />
            お知らせ一覧に戻る
          </NuxtLink>
        </div>
      </div>
    </article>
  </div>
</template>
