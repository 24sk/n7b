<script setup lang="ts">
interface HighlightItem {
  text: string
}

const highlights: HighlightItem[] = [
  { text: 'アイデアをカタチにする工房' },
  { text: '学び合いコミュニティの拠点' },
  { text: 'オリジナルプロダクトの開発・販売' },
]
</script>

<template>
  <section class="relative isolate overflow-hidden bg-neutral-900">
    <div class="absolute inset-0" aria-hidden="true">
      <!-- 本番では <NuxtImg src="/images/hero.jpg" alt="" class="size-full object-cover" /> に差し替え -->
      <div class="size-full bg-gradient-to-br from-teal-900 via-teal-800 to-neutral-900" />
      <div class="absolute inset-0 bg-gradient-to-tr from-neutral-900/85 via-neutral-900/55 to-neutral-900/15" />
      <div class="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-transparent to-transparent" />
    </div>

    <div class="relative mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-6 pt-28 pb-16 sm:px-8 lg:min-h-[680px] lg:px-12 lg:pt-36 lg:pb-28">
      <div class="max-w-2xl">
        <h1 class="text-hero font-bold leading-tight tracking-[0.02em] text-white sm:text-[3.25rem]">
          つくる、記す、<br>つながる。<br>
          <span class="relative inline-block">
            <span class="relative z-10">ここが僕たちの</span>
            <span class="absolute inset-x-0 bottom-1 h-3 bg-accent-yellow/70" aria-hidden="true" />
          </span>
          <br>
          <span class="relative inline-block">
            <span class="relative z-10">ベースキャンプ。</span>
            <span class="absolute inset-x-0 bottom-1 h-3 bg-accent-yellow/70" aria-hidden="true" />
          </span>
        </h1>

        <p class="mt-8 text-body-lg font-medium text-white">
          ものづくり・システム開発・発信を<br>茅ヶ崎南湖の海辺から。
        </p>

        <p class="mt-6 text-body leading-relaxed text-white/85">
          南湖7丁目ベースは、制作・記録・発信の拠点。<br>
          茅ヶ崎・南湖の自然に寄りそうフィールドで、<br>
          アイデアを形にし、学び合いと出会いを生むワクワクを持ち寄る場所です。
        </p>

        <div class="mt-8">
          <UButton
            to="/about"
            color="primary"
            size="lg"
            trailing-icon="i-lucide-arrow-right"
            class="rounded-md font-medium"
          >
            N7B・南湖7丁目ベースについて
          </UButton>
        </div>
      </div>

      <aside
        class="mt-10 rounded-lg border border-white/30 bg-white/95 p-5 shadow-lg backdrop-blur lg:absolute lg:top-1/2 lg:right-12 lg:mt-0 lg:w-[280px] lg:-translate-y-1/2"
        aria-label="拠点の3つの軸"
      >
        <p class="flex items-start gap-2 text-body font-bold text-neutral-900">
          <UIcon name="i-lucide-home" class="mt-0.5 size-4 text-teal-700" />
          <span>茅ヶ崎・南湖の海辺にある<br>「つくる・記す・つながる」拠点</span>
        </p>
        <ul class="mt-4 space-y-2">
          <li
            v-for="item in highlights"
            :key="item.text"
            class="flex items-start gap-2 text-caption text-neutral-700"
          >
            <UIcon name="i-lucide-check" class="mt-0.5 size-3.5 shrink-0 text-teal-600" />
            <span>{{ item.text }}</span>
          </li>
        </ul>
        <NuxtLink
          to="/about"
          class="mt-4 inline-flex items-center gap-1 text-caption font-medium text-teal-700 transition-colors hover:text-teal-800"
        >
          詳しく見る
          <UIcon name="i-lucide-chevron-right" class="size-3.5" />
        </NuxtLink>
      </aside>
    </div>
  </section>
</template>
