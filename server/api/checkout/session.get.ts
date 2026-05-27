import { z } from 'zod'
import { useStripe } from '~~/server/utils/stripe'

const querySchema = z.object({
  // Stripe Checkout Session ID は cs_test_ / cs_live_ 接頭辞 + 英数字
  id: z.string().regex(/^cs_(?:test|live)_[A-Za-z0-9]+$/),
})

function maskEmail(email: string | null | undefined): string | null {
  if (!email)
    return null
  const [local, domain] = email.split('@')
  if (!local || !domain)
    return email
  const masked = local.length <= 2
    ? `${local[0]}*`
    : `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}`
  return `${masked}@${domain}`
}

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedQuery(event, querySchema.parse)

  const stripe = useStripe()
  const session = await stripe.checkout.sessions.retrieve(id, {
    expand: ['line_items'],
  })

  return {
    id: session.id,
    status: session.status, // 'open' | 'complete' | 'expired'
    paymentStatus: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
    amountTotal: session.amount_total,
    currency: session.currency,
    customerEmail: maskEmail(session.customer_details?.email),
    customerName: session.customer_details?.name ?? null,
    lineItems: (session.line_items?.data ?? []).map(item => ({
      description: item.description,
      quantity: item.quantity,
      amountTotal: item.amount_total,
    })),
  }
})
