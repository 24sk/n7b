<script setup lang="ts">
import type { NewsListItem } from '~~/shared/types/news'
import { formatNewsDate, isRecent, newsCategoryClass } from '~/utils/news'

const { data: news, pending, error } = await useFetch<NewsListItem[]>('/api/news', {
  default: () => [],
})

usePageSeo({
  title: 'お知らせ',
  description: '南湖7丁目ベースからのお知らせ・イベント・制作・リリース情報の一覧です。',
  path: '/news',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="mb-10">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            News
          </p>
          <h1 class="mt-4 text-h1 font-bold text-neutral-900">
            お知らせ
          </h1>
          <p class="mt-4 text-body leading-relaxed text-neutral-700">
            南湖7丁目ベースの活動や、ものづくり・イベントに関する最新情報をお届けします。
          </p>
        </header>

        <div v-if="pending && !news.length" class="space-y-3">
          <USkeleton v-for="i in 6" :key="i" class="h-14 w-full rounded-md" />
        </div>

        <div v-else-if="error" class="rounded-md border border-error/30 bg-error/5 p-6 text-body text-error">
          お知らせの取得に失敗しました。時間をおいて再度お試しください。
        </div>

        <div v-else-if="!news.length" class="rounded-md border border-neutral-300 bg-neutral-50 p-6 text-body text-neutral-700">
          まだお知らせはありません。次の更新まで、もう少しお待ちください。
        </div>

        <ul v-else class="divide-y divide-neutral-100">
          <li v-for="item in news" :key="item.id">
            <NuxtLink
              :to="`/news/${item.slug}`"
              class="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 py-4 transition-colors hover:bg-neutral-50/50"
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
    </section>
  </div>
</template>
