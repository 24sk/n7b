<script setup lang="ts">
interface Pillar {
  id: string
  icon: string
  title: string
  subtitle: string
  description: string
}

const pillars: Pillar[] = [
  {
    id: 'make',
    icon: 'i-lucide-hammer',
    title: 'つくる',
    subtitle: 'Make',
    description:
      'フィールドの体感や日々の研究から、プロダクト・ツール・システムを形にしています。手ざわりと使い心地を、ていねいに。',
  },
  {
    id: 'write',
    icon: 'i-lucide-notebook-pen',
    title: '記す',
    subtitle: 'Write',
    description:
      'つくったもの・考えたことを文章とビジュアルで記録し、ジャーナルとして発信。学びをアーカイブし、次の制作につなげます。',
  },
  {
    id: 'connect',
    icon: 'i-lucide-users',
    title: 'つながる',
    subtitle: 'Connect',
    description:
      '同じく手を動かす人たちと交わり、学び合うコミュニティを育てます。フィールドを共有する人の出入りする拠点でありたい。',
  },
]

interface InfoItem {
  label: string
  value: string
}

const info: InfoItem[] = [
  { label: '所在地', value: '神奈川県茅ヶ崎市南湖7丁目（詳細はお問い合わせください）' },
  { label: '運営', value: '内田 剛 / 南湖7丁目ベース' },
  { label: '活動', value: 'ものづくり / システム開発 / 発信 / ワークショップ' },
  { label: '連絡', value: 'contact@nango7base.jp' },
]

usePageSeo({
  title: 'About',
  description:
    '南湖7丁目ベースは、茅ヶ崎・南湖の海辺にある、ものづくり・システム開発・発信の拠点。「つくる、記す、つながる」を軸に活動しています。',
  path: '/about',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            About N7B
          </p>
          <h1 class="mt-4 text-hero font-bold leading-tight tracking-[0.02em] text-neutral-900">
            ここは、
            <span class="relative inline-block">
              <span class="relative z-10">ものづくりと記録</span>
              <span class="absolute inset-x-0 bottom-1 h-3 bg-accent-yellow/70" aria-hidden="true" />
            </span>
            <br>
            の<span class="relative inline-block">
              <span class="relative z-10">ベースキャンプ</span>
              <span class="absolute inset-x-0 bottom-1 h-3 bg-accent-yellow/70" aria-hidden="true" />
            </span>です。
          </h1>
          <p class="mt-8 text-body-lg leading-relaxed text-neutral-700">
            南湖7丁目ベース（N7B）は、神奈川県茅ヶ崎市・南湖の海辺にある、<br class="hidden lg:inline">
            ものづくり・システム開発・発信の拠点です。<br>
            フィールド（自然・地域）との接点を起点に、アイデアを形にし、<br class="hidden lg:inline">
            学び合うコミュニティを育てる場所として運営しています。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="max-w-2xl">
          <h2 class="text-h2 font-bold text-neutral-900">
            3つの軸
          </h2>
          <p class="mt-3 text-body text-neutral-700">
            「つくる・記す・つながる」を活動の柱としています。
          </p>
        </header>

        <ul class="mt-10 grid gap-6 lg:grid-cols-3">
          <li
            v-for="pillar in pillars"
            :key="pillar.id"
            class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm lg:p-8"
          >
            <span class="flex size-12 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <UIcon :name="pillar.icon" class="size-6" />
            </span>
            <div>
              <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
                {{ pillar.subtitle }}
              </p>
              <h3 class="mt-1 text-h2 font-bold text-neutral-900">
                {{ pillar.title }}
              </h3>
            </div>
            <p class="text-body leading-relaxed text-neutral-700">
              {{ pillar.description }}
            </p>
          </li>
        </ul>
      </div>
    </section>

    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 class="text-h2 font-bold text-neutral-900">
              拠点について
            </h2>
            <div class="mt-6 space-y-4 text-body leading-relaxed text-neutral-700">
              <p>
                茅ヶ崎・南湖は、相模湾を望む海辺のまち。
                朝の波音、夕方の海風、ランタンの灯り——
                日々のうつろいをそのまま設計の素材にできる場所です。
              </p>
              <p>
                N7B は固定の店舗ではなく、制作と発信の「ベース」として運営しています。
                プロダクト販売、システム開発のご相談、ワークショップなど、
                フィールドから生まれるものを少しずつ拡げていきます。
              </p>
            </div>
          </div>

          <dl class="divide-y divide-neutral-100 rounded-lg border border-neutral-100 bg-neutral-50/60">
            <div
              v-for="item in info"
              :key="item.label"
              class="grid grid-cols-[6rem_1fr] gap-4 px-6 py-4 lg:grid-cols-[8rem_1fr]"
            >
              <dt class="text-caption font-medium text-neutral-500">
                {{ item.label }}
              </dt>
              <dd class="text-body text-neutral-900">
                {{ item.value }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <section class="bg-teal-50">
      <div class="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
        <div class="max-w-xl">
          <h2 class="text-h2 font-bold text-neutral-900">
            一緒にものづくりしませんか
          </h2>
          <p class="mt-3 text-body text-neutral-700">
            制作のご相談、システム開発のご依頼、ワークショップ企画など、お気軽にどうぞ。
          </p>
        </div>
        <UButton
          to="/contact"
          color="primary"
          size="lg"
          trailing-icon="i-lucide-arrow-right"
          class="rounded-md font-medium"
        >
          お問い合わせ
        </UButton>
      </div>
    </section>
  </div>
</template>
