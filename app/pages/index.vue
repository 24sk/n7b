<script setup lang="ts">
usePageSeo({
  description:
    'つくる、記す、つながる。茅ヶ崎・南湖の海辺にある、ものづくり・システム開発・発信のベースキャンプ。',
  path: '/',
})
</script>

<template>
  <div>
    <HomeHero />
    <HomeProducts />
    <HomeCategories />
    <HomeJournal />
    <HomeContactAndNews />

    <section class="bg-white">
      <div class="mx-auto grid max-w-7xl gap-6 px-4 pt-4 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pb-24">
        <HomeNewsletter />
        <HomeSocial />
      </div>
    </section>
  </div>
</template>
