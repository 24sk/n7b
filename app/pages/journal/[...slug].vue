<script setup lang="ts">
import { journalCategoryClass } from '~/utils/journal'
import { formatNewsDate } from '~/utils/news'

const route = useRoute()

const { data: article } = await useAsyncData(
  () => `journal-${route.path}`,
  () => queryCollection('journal').path(route.path).first(),
)

if (!article.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '記事が見つかりませんでした',
    fatal: true,
  })
}

const { data: related } = await useAsyncData(
  () => `journal-related-${route.path}`,
  async () => {
    if (!article.value)
      return []
    const sameCategory = await queryCollection('journal')
      .select('path', 'title', 'description', 'publishedAt', 'category', 'hero')
      .where('category', '=', article.value.category)
      .where('path', '<>', article.value.path)
      .order('publishedAt', 'DESC')
      .limit(3)
      .all()
    if (sameCategory.length >= 3)
      return sameCategory
    const fillCount = 3 - sameCategory.length
    const excludePaths = new Set([article.value.path, ...sameCategory.map(a => a.path)])
    const recent = await queryCollection('journal')
      .select('path', 'title', 'description', 'publishedAt', 'category', 'hero')
      .order('publishedAt', 'DESC')
      .limit(fillCount + excludePaths.size)
      .all()
    const fillers = recent.filter(a => !excludePaths.has(a.path)).slice(0, fillCount)
    return [...sameCategory, ...fillers]
  },
  { default: () => [], watch: [article] },
)

usePageSeo({
  title: article.value.title,
  description: article.value.description,
  path: route.path,
})
</script>

<template>
  <div v-if="article">
    <article class="bg-white">
      <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="mb-8">
          <div class="flex flex-wrap items-center gap-3">
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
          <h1 class="mt-4 text-h1 font-bold text-neutral-900">
            {{ article.title }}
          </h1>
          <p class="mt-4 text-body-lg leading-relaxed text-neutral-700">
            {{ article.description }}
          </p>
        </header>

        <div v-if="article.hero" class="mb-10 aspect-[16/9] overflow-hidden rounded bg-neutral-100">
          <NuxtImg
            :src="article.hero"
            :alt="article.title"
            width="1200"
            height="675"
            sizes="(min-width: 1024px) 768px, 100vw"
            class="size-full object-cover"
          />
        </div>

        <ContentRenderer :value="article" class="article-body" />

        <div v-if="article.tags?.length" class="mt-10 flex flex-wrap gap-2">
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="rounded-full bg-neutral-100 px-3 py-1 text-caption text-neutral-700"
          >
            #{{ tag }}
          </span>
        </div>

        <div class="mt-12 border-t border-neutral-100 pt-8">
          <NuxtLink
            to="/journal"
            class="inline-flex items-center gap-1 text-body font-medium text-teal-700 transition-colors hover:text-teal-800"
          >
            <UIcon name="i-lucide-chevron-left" class="size-4" />
            ジャーナル一覧に戻る
          </NuxtLink>
        </div>
      </div>
    </article>

    <section v-if="related.length" class="border-t border-neutral-100 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 class="text-h2 font-bold text-neutral-900">
          関連する記録
        </h2>
        <ul class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-x-6">
          <li v-for="item in related" :key="item.path">
            <NuxtLink :to="item.path" class="group block">
              <div class="aspect-[16/9] overflow-hidden rounded bg-neutral-100">
                <NuxtImg
                  v-if="item.hero"
                  :src="item.hero"
                  :alt="item.title"
                  width="600"
                  height="338"
                  loading="lazy"
                  class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div v-else class="flex size-full items-center justify-center text-neutral-300">
                  <UIcon name="i-lucide-image" class="size-10" />
                </div>
              </div>
              <div class="mt-3 space-y-1.5">
                <div class="flex items-center gap-3">
                  <span
                    class="inline-block rounded px-2 py-0.5 text-[10px] font-medium"
                    :class="[journalCategoryClass[item.category]]"
                  >
                    {{ item.category }}
                  </span>
                  <time class="font-en text-caption text-neutral-500">
                    {{ formatNewsDate(item.publishedAt) }}
                  </time>
                </div>
                <h3 class="line-clamp-2 min-h-[2.6em] text-body font-bold text-neutral-900 transition-colors group-hover:text-teal-700">
                  {{ item.title }}
                </h3>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
