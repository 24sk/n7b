<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const route = useRoute()
const cart = useCartStore()

const jpy = new Intl.NumberFormat('ja-JP')

const sessionId = computed(() => {
  const v = route.query.session_id
  return typeof v === 'string' ? v : null
})

const { data: order, error, pending } = await useFetch('/api/checkout/session', {
  query: { id: sessionId },
  // session_id が無い場合は API を叩かない
  immediate: !!sessionId.value,
  watch: false,
})

// 注文確定が確認できたタイミングでカートをクリアする
watchEffect(() => {
  if (order.value?.paymentStatus === 'paid' || order.value?.status === 'complete')
    cart.clear()
})

usePageSeo({
  title: 'ご注文ありがとうございます',
  description: '南湖7丁目ベース — ご注文を承りました。',
  path: '/checkout/success',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div v-if="!sessionId" class="rounded-lg border border-neutral-300 bg-neutral-50 p-10 text-center">
          <UIcon name="i-lucide-alert-circle" class="mx-auto size-10 text-neutral-500" />
          <p class="mt-4 text-body text-neutral-700">
            注文情報が見つかりませんでした。
          </p>
          <UButton to="/shop" color="primary" class="mt-6" icon="i-lucide-arrow-right">
            拠点で生まれたものを見る
          </UButton>
        </div>

        <div v-else-if="pending" class="space-y-4">
          <USkeleton class="h-8 w-2/3" />
          <USkeleton class="h-5 w-full" />
          <USkeleton class="h-40 w-full" />
        </div>

        <div v-else-if="error || !order" class="rounded-lg border border-error/40 bg-error/5 p-10 text-center">
          <UIcon name="i-lucide-alert-triangle" class="mx-auto size-10 text-error" />
          <p class="mt-4 text-body text-neutral-700">
            注文情報の取得に失敗しました。決済自体は完了している可能性がありますので、メールをご確認のうえ、ご不明な点は<NuxtLink to="/contact" class="text-teal-700 hover:text-teal-800">
              お問い合わせ
            </NuxtLink>からご連絡ください。
          </p>
        </div>

        <article v-else>
          <header class="border-b border-neutral-100 pb-8">
            <UIcon name="i-lucide-check-circle-2" class="size-10 text-success" />
            <h1 class="mt-4 text-h1 font-bold text-neutral-900">
              ご注文ありがとうございます
            </h1>
            <p class="mt-3 text-body text-neutral-700">
              <template v-if="order.paymentStatus === 'paid'">
                お支払いが完了しました。準備ができ次第、ご指定の住所にお届けします。
              </template>
              <template v-else-if="order.paymentStatus === 'unpaid'">
                ご注文を承りました。コンビニ決済の場合は、お支払い番号を記載したメールが届きます。期限内にお支払いください。
              </template>
              <template v-else>
                ご注文を受け付けました。
              </template>
            </p>
            <p class="mt-2 text-caption text-neutral-500">
              注文番号: {{ order.id }}
            </p>
          </header>

          <div class="mt-8 space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 p-6 text-body">
            <div v-if="order.customerName" class="flex justify-between gap-4">
              <dt class="text-neutral-500">
                お名前
              </dt>
              <dd class="text-neutral-900">
                {{ order.customerName }} 様
              </dd>
            </div>
            <div v-if="order.customerEmail" class="flex justify-between gap-4">
              <dt class="text-neutral-500">
                メールアドレス
              </dt>
              <dd class="text-neutral-900">
                {{ order.customerEmail }}
              </dd>
            </div>
          </div>

          <section class="mt-8">
            <h2 class="text-h3 font-bold text-neutral-900">
              ご注文内容
            </h2>
            <ul class="mt-4 divide-y divide-neutral-100 border-y border-neutral-100">
              <li v-for="(item, idx) in order.lineItems" :key="idx" class="flex justify-between py-4 text-body">
                <div class="min-w-0 pr-4">
                  <p class="font-medium text-neutral-900">
                    {{ item.description }}
                  </p>
                  <p class="mt-1 text-caption text-neutral-500">
                    数量: {{ item.quantity ?? 1 }}
                  </p>
                </div>
                <p class="shrink-0 font-bold text-neutral-900">
                  ¥{{ jpy.format(item.amountTotal ?? 0) }}
                </p>
              </li>
            </ul>
            <div v-if="order.amountTotal != null" class="mt-6 flex justify-between text-h3 font-bold text-neutral-900">
              <span>合計 (税込・送料込)</span>
              <span>¥{{ jpy.format(order.amountTotal) }}</span>
            </div>
          </section>

          <footer class="mt-10 flex flex-wrap gap-3">
            <UButton to="/shop" color="primary" icon="i-lucide-arrow-right">
              買い物を続ける
            </UButton>
            <UButton to="/" variant="outline" color="primary">
              トップへ戻る
            </UButton>
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>
