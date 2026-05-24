<script setup lang="ts">
const email = ref('')

function onSubmit() {
  /* UI のみ — 購読 API 接続は Phase 3 (3-14) で実装 */
}
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm lg:p-8">
    <div class="flex items-start gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
        <UIcon name="i-lucide-mail" class="size-5" />
      </span>
      <div>
        <h2 class="text-h3 font-bold text-neutral-900">
          最新情報をメールで受け取る
        </h2>
        <p class="mt-1 text-caption text-neutral-700">
          プロダクトやイベントの情報を月1回お届けします。
        </p>
      </div>
    </div>

    <form class="flex flex-col gap-3 sm:flex-row" @submit.prevent="onSubmit">
      <label class="sr-only" for="newsletter-email">メールアドレス</label>
      <UInput
        id="newsletter-email"
        v-model="email"
        type="email"
        placeholder="メールアドレスを入力"
        size="lg"
        class="flex-1"
        autocomplete="email"
      />
      <UButton type="submit" color="primary" size="lg" class="rounded-md font-medium">
        登録する
      </UButton>
    </form>
  </div>
</template>
