import type Stripe from 'stripe'
import { useStripe } from '~~/server/utils/stripe'

/**
 * Stripe Webhook 受信エンドポイント (基盤)
 *
 * 役割:
 * - 署名検証 (stripe-signature ヘッダ vs STRIPE_WEBHOOK_SECRET)
 * - イベントタイプ別の dispatch 基盤
 *
 * 具体的なイベントハンドラ (注文 DB 登録 / メール送信 / 返金処理) は Week 4 で実装する。
 *
 * Stripe Dashboard 側の設定:
 * - エンドポイント URL: https://nango7base.jp/api/webhooks/stripe
 * - イベント: checkout.session.completed, checkout.session.async_payment_succeeded,
 *           checkout.session.async_payment_failed, charge.refunded
 */
export default defineEventHandler(async (event) => {
  const { stripeWebhookSecret } = useRuntimeConfig(event)
  if (!stripeWebhookSecret) {
    throw createError({ statusCode: 500, statusMessage: 'STRIPE_WEBHOOK_SECRET is not set' })
  }

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature header' })
  }

  // 署名検証には生の body が必要 (h3 の自動 JSON パースを通してはいけない)
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty request body' })
  }

  const stripe = useStripe()
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
  }
  catch (err) {
    console.error('[webhooks/stripe] signature verification failed', err)
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  // dispatch — 具体処理は Week 4 で実装
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed':
    case 'charge.refunded':
      // Week 4 で各イベントの後続処理 (Notion 注文 DB 登録 / Resend 通知 / 返金反映) を実装する
      break
    default:
      // 未購読のイベントは無視 (Stripe は 2xx を期待)
      break
  }

  return { received: true }
})
