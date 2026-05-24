<script setup lang="ts">
interface Category {
  id: string
  title: string
  subtitle: string
  to: string
  bg: string
}

const categories: Category[] = [
  {
    id: 'works',
    title: 'Works',
    subtitle: '制作実績',
    to: '/works',
    bg: 'from-teal-700 via-teal-800 to-teal-900',
  },
  {
    id: 'journal',
    title: 'Journal',
    subtitle: 'ジャーナル',
    to: '/journal',
    bg: 'from-neutral-700 via-neutral-900 to-teal-900',
  },
  {
    id: 'base-camp',
    title: 'Base Camp',
    subtitle: '有料コンテンツ',
    to: '/base-camp',
    bg: 'from-accent-yellow/40 via-neutral-700 to-neutral-900',
  },
  {
    id: 'community',
    title: 'Community',
    subtitle: 'コミュニティ',
    to: '/community',
    bg: 'from-teal-600 via-teal-800 to-neutral-900',
  },
]
</script>

<template>
  <section class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <li v-for="category in categories" :key="category.id">
          <NuxtLink
            :to="category.to"
            class="group relative block aspect-[4/3] overflow-hidden rounded-lg"
          >
            <div class="absolute inset-0 bg-gradient-to-br" :class="[category.bg]" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            <div class="absolute right-4 bottom-4 left-4 text-white">
              <h3 class="font-en text-h2 font-bold leading-none">
                {{ category.title }}
              </h3>
              <p class="mt-2 text-caption text-white/90">
                {{ category.subtitle }}
              </p>
            </div>

            <span
              class="absolute right-4 bottom-4 flex size-8 items-center justify-center rounded-full bg-white/90 text-teal-700 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            >
              <UIcon name="i-lucide-arrow-right" class="size-4" />
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
