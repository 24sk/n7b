<script setup lang="ts">
const route = useRoute()
const token = computed(() => {
  const raw = route.query.token
  return typeof raw === 'string' ? raw : ''
})

const status = ref<'pending' | 'ok' | 'error'>('pending')
const errorMessage = ref('')
const unsubscribedEmail = ref('')

onMounted(async () => {
  if (!token.value) {
    status.value = 'error'
    errorMessage.value = '配信解除リンクのトークンが見つかりません。'
    return
  }
  try {
    const res = await $fetch<{ ok: true, email: string }>('/api/newsletter/unsubscribe', {
      method: 'POST',
      body: { token: token.value },
    })
    unsubscribedEmail.value = res.email
    status.value = 'ok'
  }
  catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }, statusMessage?: string }
    errorMessage.value
      = fetchErr.data?.statusMessage
        ?? fetchErr.statusMessage
        ?? '配信解除に失敗しました。お手数ですが contact@nango7base.jp までご連絡ください。'
    status.value = 'error'
  }
})

usePageSeo({
  title: 'メルマガ配信解除',
  description: '南湖7丁目ベース メルマガの配信解除ページ',
  path: '/newsletter/unsubscribe',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="mb-10">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            Newsletter
          </p>
          <h1 class="mt-4 text-h1 font-bold text-neutral-900">
            メルマガ配信の解除
          </h1>
        </header>

        <div v-if="status === 'pending'" class="flex items-center gap-3 text-body text-neutral-700">
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-teal-700" />
          処理中です。少しお待ちください...
        </div>

        <div v-else-if="status === 'ok'" class="rounded-lg border border-neutral-300 bg-neutral-50 p-6" role="status">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-check-circle-2" class="mt-1 size-6 text-neutral-700" />
            <div>
              <h2 class="text-h3 font-bold text-neutral-900">
                配信を解除しました
              </h2>
              <p class="mt-2 text-body text-neutral-700">
                <span class="font-medium">{{ unsubscribedEmail }}</span> へのメルマガ配信を停止しました。<br>
                これまでご購読いただきありがとうございました。
              </p>
              <NuxtLink
                to="/"
                class="mt-4 inline-flex items-center gap-1 text-body font-medium text-teal-700 transition-colors hover:text-teal-800"
              >
                トップへ戻る
                <UIcon name="i-lucide-chevron-right" class="size-4" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-else class="rounded-md border border-error/30 bg-error/5 p-6" role="alert">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-circle-alert" class="mt-1 size-6 text-error" />
            <div>
              <h2 class="text-h3 font-bold text-neutral-900">
                配信解除に失敗しました
              </h2>
              <p class="mt-2 text-body text-neutral-700">
                {{ errorMessage }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
