<script setup lang="ts">
import type { JournalCategory } from '~~/shared/types/journal'
import { journalCategories } from '~~/shared/types/journal'
import { journalCategoryClass } from '~/utils/journal'
import { formatNewsDate } from '~/utils/news'

const route = useRoute()
const router = useRouter()

const selectedCategory = computed<JournalCategory | null>(() => {
  const raw = route.query.category
  if (typeof raw !== 'string')
    return null
  return (journalCategories as readonly string[]).includes(raw)
    ? (raw as JournalCategory)
    : null
})

const { data: articles, pending, error } = await useAsyncData(
  'journal-list',
  () => queryCollection('journal')
    .select('path', 'title', 'description', 'publishedAt', 'category', 'hero')
    .order('publishedAt', 'DESC')
    .all(),
  { default: () => [] },
)

const filteredArticles = computed(() => {
  if (!selectedCategory.value)
    return articles.value
  return articles.value.filter(a => a.category === selectedCategory.value)
})

function selectCategory(category: JournalCategory | null) {
  const query = { ...route.query }
  if (category)
    query.category = category
  else
    delete query.category
  router.push({ query })
}

usePageSeo({
  title: 'Journal',
  description: '南湖7丁目ベースの制作・リサーチ・雑記を記録するジャーナルです。',
  path: '/journal',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="mb-10">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            Journal
          </p>
          <h1 class="mt-4 text-h1 font-bold text-neutral-900">
            ジャーナル
          </h1>
          <p class="mt-4 max-w-2xl text-body leading-relaxed text-neutral-700">
            拠点での制作・リサーチ・日々の雑記を綴る記録。完成形ではなく、いま考えていることや手を動かしている過程を残します。
          </p>
        </header>

        <div class="mb-10 flex flex-wrap items-center gap-2" role="group" aria-label="カテゴリで絞り込む">
          <button
            type="button"
            class="rounded-full border px-4 py-1.5 text-caption font-medium transition-colors"
            :class="selectedCategory === null
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-neutral-300 bg-white text-neutral-700 hover:border-teal-600 hover:text-teal-700'"
            @click="selectCategory(null)"
          >
            すべて
          </button>
          <button
            v-for="category in journalCategories"
            :key="category"
            type="button"
            class="rounded-full border px-4 py-1.5 text-caption font-medium transition-colors"
            :class="selectedCategory === category
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-neutral-300 bg-white text-neutral-700 hover:border-teal-600 hover:text-teal-700'"
            @click="selectCategory(category)"
          >
            {{ category }}
          </button>
        </div>

        <div v-if="pending && !articles.length" class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
          <div v-for="i in 6" :key="i" class="space-y-3">
            <USkeleton class="aspect-[16/9] w-full rounded" />
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-5 w-full" />
            <USkeleton class="h-4 w-5/6" />
          </div>
        </div>

        <div v-else-if="error" class="rounded-md border border-error/30 bg-error/5 p-6 text-body text-error">
          記事の取得に失敗しました。時間をおいて再度お試しください。
        </div>

        <div v-else-if="!filteredArticles.length" class="rounded-md border border-neutral-300 bg-neutral-50 p-6 text-body text-neutral-700">
          <template v-if="selectedCategory">
            「{{ selectedCategory }}」に該当する記事はまだありません。
          </template>
          <template v-else>
            まだ記事がありません。準備中ですので、もう少しお待ちください。
          </template>
        </div>

        <ul v-else class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
          <li v-for="article in filteredArticles" :key="article.path">
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
                <h2 class="line-clamp-2 min-h-[3em] text-h3 font-bold text-neutral-900 transition-colors group-hover:text-teal-700">
                  {{ article.title }}
                </h2>
                <p class="line-clamp-2 text-body text-neutral-700">
                  {{ article.description }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
