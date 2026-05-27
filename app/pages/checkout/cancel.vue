<script setup lang="ts">
usePageSeo({
  title: '決済をキャンセルしました',
  description: '南湖7丁目ベース — 決済をキャンセルしました。カートの内容はそのまま残っています。',
  path: '/checkout/cancel',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="rounded-lg border border-neutral-300 bg-neutral-50 p-10 text-center">
          <UIcon name="i-lucide-info" class="mx-auto size-10 text-neutral-500" />
          <h1 class="mt-4 text-h1 font-bold text-neutral-900">
            決済をキャンセルしました
          </h1>
          <p class="mt-4 text-body text-neutral-700">
            カートの内容はそのまま残っています。再度ご注文いただく場合は、カートからお進みください。
          </p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <UButton to="/cart" color="primary" icon="i-lucide-shopping-bag">
              カートに戻る
            </UButton>
            <UButton to="/shop" variant="outline" color="primary">
              買い物を続ける
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
