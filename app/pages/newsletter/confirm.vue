<script setup lang="ts">
const route = useRoute()
const token = computed(() => {
  const raw = route.query.token
  return typeof raw === 'string' ? raw : ''
})

const status = ref<'pending' | 'ok' | 'error'>('pending')
const errorMessage = ref('')
const confirmedEmail = ref('')

onMounted(async () => {
  if (!token.value) {
    status.value = 'error'
    errorMessage.value = '確認リンクのトークンが見つかりません。'
    return
  }
  try {
    const res = await $fetch<{ ok: true, email: string }>('/api/newsletter/confirm', {
      method: 'POST',
      body: { token: token.value },
    })
    confirmedEmail.value = res.email
    status.value = 'ok'
  }
  catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }, statusMessage?: string }
    errorMessage.value
      = fetchErr.data?.statusMessage
        ?? fetchErr.statusMessage
        ?? '確認に失敗しました。お手数ですが再度メルマガ登録をお試しください。'
    status.value = 'error'
  }
})

usePageSeo({
  title: 'メルマガ登録の確認',
  description: '南湖7丁目ベース メルマガの登録確認ページ',
  path: '/newsletter/confirm',
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
            メルマガ登録の確認
          </h1>
        </header>

        <div v-if="status === 'pending'" class="flex items-center gap-3 text-body text-neutral-700">
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-teal-700" />
          確認中です。少しお待ちください...
        </div>

        <div v-else-if="status === 'ok'" class="rounded-lg border border-teal-100 bg-teal-50 p-6" role="status">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-check-circle-2" class="mt-1 size-6 text-teal-700" />
            <div>
              <h2 class="text-h3 font-bold text-neutral-900">
                登録が完了しました
              </h2>
              <p class="mt-2 text-body text-neutral-700">
                <span class="font-medium">{{ confirmedEmail }}</span> 宛にメルマガをお送りします。<br>
                よろしくお願いいたします。
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
                確認に失敗しました
              </h2>
              <p class="mt-2 text-body text-neutral-700">
                {{ errorMessage }}
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
      </div>
    </section>
  </div>
</template>
