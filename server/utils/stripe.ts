import Stripe from 'stripe'

let cachedClient: Stripe | null = null

export function useStripe(): Stripe {
  if (cachedClient)
    return cachedClient
  const { stripeSecretKey } = useRuntimeConfig()
  if (!stripeSecretKey)
    throw createError({ statusCode: 500, statusMessage: 'STRIPE_SECRET_KEY is not set' })
  cachedClient = new Stripe(stripeSecretKey)
  return cachedClient
}
