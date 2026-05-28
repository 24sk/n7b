import { z } from 'zod'
import { fetchAllStock } from '~~/server/utils/notion-inventory'
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

  // Notion 在庫を直接再チェック (10 分キャッシュを通さず最新値で照合)。
  // Notion 障害時は許容して続行 — Webhook 側で `stock_processed` + `flagShortage` で事後検知する
  try {
    const stockRows = await fetchAllStock()
    const stockMap = new Map(stockRows.map(r => [r.slug, r.stock]))
    const shortages = resolved
      .map(({ product, quantity }) => ({
        slug: product.slug,
        name: product.name,
        requested: quantity,
        available: stockMap.get(product.slug) ?? 0,
      }))
      .filter(s => s.available < s.requested)
    if (shortages.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: '在庫が不足しています',
        data: { shortages },
      })
    }
  }
  catch (err: unknown) {
    // 上で throw した 409 はそのまま伝搬させる
    if (typeof err === 'object' && err !== null && 'statusCode' in err && (err as { statusCode: number }).statusCode === 409)
      throw err
    console.error('[checkout] Notion 在庫再チェック失敗。許容して続行', err)
  }

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
