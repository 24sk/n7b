<script setup lang="ts">
const siteName = '南湖7丁目ベース'
const defaultDescription = 'つくる、記す、つながる。茅ヶ崎・南湖の海辺にあるフィールドラボ & ベースキャンプ。'
const siteUrl = 'https://nango7base.jp'

useHead({
  titleTemplate: title => (title ? `${title} | ${siteName}` : `N7B — ${siteName}`),
  htmlAttrs: { lang: 'ja' },
})

useSeoMeta({
  description: defaultDescription,
  ogSiteName: siteName,
  ogType: 'website',
  ogLocale: 'ja_JP',
  ogUrl: siteUrl,
  ogTitle: `N7B — ${siteName}`,
  ogDescription: defaultDescription,
  twitterCard: 'summary_large_image',
  twitterTitle: `N7B — ${siteName}`,
  twitterDescription: defaultDescription,
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
