<script setup lang="ts">
import { journalCategoryClass } from '~/utils/journal'
import { formatNewsDate } from '~/utils/news'

const { data: articles, pending } = await useAsyncData(
  'home-journal-latest',
  () => queryCollection('journal')
    .select('path', 'title', 'description', 'publishedAt', 'category', 'hero')
    .order('publishedAt', 'DESC')
    .limit(3)
    .all(),
  { default: () => [] },
)
</script>

<template>
  <section class="bg-neutral-50">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-h2 font-bold text-neutral-900">
            <UIcon name="i-lucide-notebook-pen" class="size-5 text-teal-700" />
            最新のジャーナル
          </h2>
          <p class="mt-3 text-body text-neutral-700">
            拠点での制作・リサーチ・日々の雑記。<br>
            完成形ではなく、いま考えていることや手を動かしている過程を綴っています。
          </p>
        </div>
        <NuxtLink
          to="/journal"
          class="inline-flex items-center gap-1 text-caption font-medium text-teal-700 transition-colors hover:text-teal-800"
        >
          すべての記事を見る
          <UIcon name="i-lucide-chevron-right" class="size-3.5" />
        </NuxtLink>
      </header>

      <div v-if="pending && !articles.length" class="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
        <div v-for="i in 3" :key="i" class="space-y-3">
          <USkeleton class="aspect-[16/9] w-full rounded" />
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-5 w-full" />
          <USkeleton class="h-4 w-5/6" />
        </div>
      </div>

      <div
        v-else-if="!articles.length"
        class="mt-10 rounded-md border border-neutral-300 bg-white p-6 text-body text-neutral-700"
      >
        まだ記事がありません。準備中ですので、もう少しお待ちください。
      </div>

      <ul v-else class="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
        <li v-for="article in articles" :key="article.path">
          <NuxtLink :to="article.path" class="group block">
            <div class="aspect-[16/9] overflow-hidden rounded bg-neutral-100">
              <NuxtImg
                v-if="article.hero"
                :src="article.hero"
                :alt="article.title"
                width="800"
                height="450"
                loading="lazy"
                class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div v-else class="flex size-full items-center justify-center text-neutral-300">
                <UIcon name="i-lucide-image" class="size-12" />
              </div>
            </div>
            <div class="mt-4 space-y-2">
              <div class="flex items-center gap-3">
                <span
                  class="inline-block rounded px-2 py-0.5 text-[10px] font-medium"
                  :class="[journalCategoryClass[article.category]]"
                >
                  {{ article.category }}
                </span>
                <time class="font-en text-caption text-neutral-500">
                  {{ formatNewsDate(article.publishedAt) }}
                </time>
              </div>
              <h3 class="line-clamp-2 min-h-[3em] text-h3 font-bold text-neutral-900 transition-colors group-hover:text-teal-700">
                {{ article.title }}
              </h3>
              <p class="line-clamp-2 text-body text-neutral-700">
                {{ article.description }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
