import { z } from 'zod'
import { getProductBySlug } from '~~/server/utils/products'
import { buildShippingOptions, resolveBillingShippingSize } from '~~/server/utils/shipping'
import { useStripe } from '~~/server/utils/stripe'

const bodySchema = z.object({
  items: z.array(z.object({
    slug: z.string().min(1),
    quantity: z.number().int().positive().max(99),
  })).min(1).max(50),
})

export default defineEventHandler(async (event) => {
  const { items } = await readValidatedBody(event, bodySchema.parse)

  // クライアントから受け取るのは slug + quantity のみ。価格・PriceID はサーバで再取得する
  const resolved = await Promise.all(items.map(async (item) => {
    const product = await getProductBySlug(item.slug)
    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: `商品が見つかりません: ${item.slug}`,
      })
    }
    return { product, quantity: item.quantity }
  }))

  const lineItems = resolved.map(({ product, quantity }) => ({
    price: product.priceId,
    quantity,
    adjustable_quantity: { enabled: true, minimum: 1, maximum: 99 },
  }))

  const shippingSize = resolveBillingShippingSize(resolved.map(({ product }) => product.shippingSize))

  const { public: { siteUrl } } = useRuntimeConfig(event)
  const stripe = useStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    payment_method_types: ['card', 'konbini'],
    locale: 'ja',
    // 価格は内税 (tax_behavior: 'inclusive') で登録済みのため Stripe Tax は使わない
    shipping_address_collection: { allowed_countries: ['JP'] },
    shipping_options: buildShippingOptions(shippingSize),
    phone_number_collection: { enabled: true },
    payment_method_options: {
      konbini: {
        // コンビニ決済の支払期限 (営業日)。デフォルト 3 日
        expires_after_days: 3,
      },
    },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
  })

  if (!session.url) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Checkout Session の URL を取得できませんでした',
    })
  }

  return { url: session.url, sessionId: session.id }
})
