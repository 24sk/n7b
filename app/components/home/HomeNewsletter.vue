<script setup lang="ts">
const email = ref('')
const turnstileToken = ref('')
const isSubmitting = ref(false)
const submitted = ref(false)
const submitError = ref<string | null>(null)
const emailError = ref<string | null>(null)

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(value)
}

async function onSubmit() {
  emailError.value = null
  submitError.value = null

  const trimmed = email.value.trim()
  if (!trimmed) {
    emailError.value = 'メールアドレスを入力してください'
    return
  }
  if (!validateEmail(trimmed)) {
    emailError.value = '有効なメールアドレスを入力してください'
    return
  }
  if (!turnstileToken.value) {
    submitError.value = 'スパム対策の検証が完了していません。少し待ってから再度お試しください。'
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: {
        email: trimmed,
        turnstileToken: turnstileToken.value,
      },
    })
    submitted.value = true
  }
  catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }, statusMessage?: string }
    submitError.value
      = fetchErr.data?.statusMessage
        ?? fetchErr.statusMessage
        ?? '送信に失敗しました。時間をおいて再度お試しください。'
    console.error('[newsletter] subscribe failed', err)
  }
  finally {
    isSubmitting.value = false
  }
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

    <div
      v-if="submitted"
      class="rounded-md border border-teal-100 bg-teal-50 p-4"
      role="status"
    >
      <div class="flex items-start gap-2">
        <UIcon name="i-lucide-check-circle-2" class="mt-0.5 size-5 shrink-0 text-teal-700" />
        <div class="text-caption text-neutral-700">
          <p class="font-medium text-neutral-900">
            確認メールをお送りしました
          </p>
          <p class="mt-1">
            メール内のリンクを24時間以内にクリックして、登録を完了してください。<br>
            届かない場合は迷惑メールフォルダもご確認ください。
          </p>
        </div>
      </div>
    </div>

    <form v-else class="flex flex-col gap-3" @submit.prevent="onSubmit">
      <div class="flex flex-col gap-3 sm:flex-row">
        <label class="sr-only" for="newsletter-email">メールアドレス</label>
        <UInput
          id="newsletter-email"
          v-model="email"
          type="email"
          placeholder="メールアドレスを入力"
          size="lg"
          class="flex-1"
          autocomplete="email"
          :disabled="isSubmitting"
        />
        <UButton
          type="submit"
          color="primary"
          size="lg"
          class="rounded-md font-medium"
          :loading="isSubmitting"
          :disabled="!turnstileToken"
        >
          登録する
        </UButton>
      </div>

      <p v-if="emailError" class="text-caption text-error" role="alert">
        {{ emailError }}
      </p>

      <NuxtTurnstile v-model="turnstileToken" />

      <p v-if="submitError" class="text-caption text-error" role="alert">
        {{ submitError }}
      </p>
    </form>
  </div>
</template>
