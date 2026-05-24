<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

interface ContactForm {
  name: string
  email: string
  company: string
  subject: 'work' | 'workshop' | 'other'
  message: string
  consent: boolean
}

const state = reactive<ContactForm>({
  name: '',
  email: '',
  company: '',
  subject: 'work',
  message: '',
  consent: false,
})

const subjectOptions = [
  { value: 'work', label: 'お仕事のご相談・開発依頼' },
  { value: 'workshop', label: 'ワークショップ・イベント' },
  { value: 'other', label: 'その他' },
]

const isSubmitting = ref(false)
const submitted = ref(false)

function validate(form: ContactForm): FormError[] {
  const errors: FormError[] = []
  if (!form.name.trim())
    errors.push({ name: 'name', message: 'お名前を入力してください' })

  if (!form.email.trim()) {
    errors.push({ name: 'email', message: 'メールアドレスを入力してください' })
  }
  else if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(form.email)) {
    errors.push({ name: 'email', message: '有効なメールアドレスを入力してください' })
  }

  if (!form.message.trim())
    errors.push({ name: 'message', message: 'お問い合わせ内容を入力してください' })
  else if (form.message.trim().length < 10)
    errors.push({ name: 'message', message: 'お問い合わせ内容は10文字以上で入力してください' })

  if (!form.consent)
    errors.push({ name: 'consent', message: 'プライバシーポリシーへの同意が必要です' })

  return errors
}

async function onSubmit(_event: FormSubmitEvent<ContactForm>) {
  isSubmitting.value = true
  /* TODO(1-23): /api/contact に POST して Notion 登録 + Resend 通知 */
  await new Promise(resolve => setTimeout(resolve, 600))
  submitted.value = true
  isSubmitting.value = false
}

usePageSeo({
  title: 'お問い合わせ',
  description:
    '南湖7丁目ベースへのお問い合わせフォーム。制作・システム開発・ワークショップなど、お気軽にご相談ください。',
  path: '/contact',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <header class="mb-10">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            Contact
          </p>
          <h1 class="mt-4 text-h1 font-bold text-neutral-900">
            お問い合わせ
          </h1>
          <p class="mt-4 text-body leading-relaxed text-neutral-700">
            ものづくりのご相談、システム開発のご依頼、ワークショップ企画など、<br>
            お気軽にご連絡ください。通常3〜5営業日以内に担当よりご返信いたします。
          </p>
        </header>

        <div
          v-if="submitted"
          class="rounded-lg border border-teal-100 bg-teal-50 p-6"
          role="status"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-check-circle-2" class="mt-1 size-6 text-teal-700" />
            <div>
              <h2 class="text-h3 font-bold text-neutral-900">
                お問い合わせを受け付けました
              </h2>
              <p class="mt-2 text-body text-neutral-700">
                ご記入いただいた内容を確認のうえ、担当より追ってご連絡いたします。<br>
                自動返信メールが届かない場合は、迷惑メールフォルダもご確認ください。
              </p>
            </div>
          </div>
        </div>

        <UForm
          v-else
          :state="state"
          :validate="validate"
          class="space-y-6"
          @submit="onSubmit"
        >
          <UFormField label="お名前" name="name" required>
            <UInput
              v-model="state.name"
              size="lg"
              autocomplete="name"
              placeholder="例: 茅ヶ崎 太郎"
              class="w-full"
            />
          </UFormField>

          <UFormField label="メールアドレス" name="email" required>
            <UInput
              v-model="state.email"
              type="email"
              size="lg"
              autocomplete="email"
              placeholder="例: you@example.com"
              class="w-full"
            />
          </UFormField>

          <UFormField label="会社・団体名 (任意)" name="company">
            <UInput
              v-model="state.company"
              size="lg"
              autocomplete="organization"
              placeholder="例: 株式会社 南湖"
              class="w-full"
            />
          </UFormField>

          <UFormField label="お問い合わせ種別" name="subject" required>
            <URadioGroup
              v-model="state.subject"
              :items="subjectOptions"
              orientation="vertical"
            />
          </UFormField>

          <UFormField label="お問い合わせ内容" name="message" required>
            <UTextarea
              v-model="state.message"
              size="lg"
              :rows="6"
              placeholder="ご相談内容をできるだけ具体的にお書きください"
              class="w-full"
            />
          </UFormField>

          <UFormField name="consent">
            <UCheckbox v-model="state.consent">
              <template #label>
                <span class="text-body text-neutral-700">
                  <NuxtLink to="/privacy" class="text-teal-700 underline hover:text-teal-800">
                    プライバシーポリシー
                  </NuxtLink>
                  に同意します
                </span>
              </template>
            </UCheckbox>
          </UFormField>

          <div class="pt-2">
            <UButton
              type="submit"
              color="primary"
              size="lg"
              :loading="isSubmitting"
              trailing-icon="i-lucide-send"
              class="rounded-md font-medium"
            >
              送信する
            </UButton>
          </div>
        </UForm>
      </div>
    </section>
  </div>
</template>
