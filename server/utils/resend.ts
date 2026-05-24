import { Resend } from 'resend'

let cachedResend: Resend | null = null

export function useResend(): Resend {
  if (cachedResend)
    return cachedResend
  const { resendApiKey } = useRuntimeConfig()
  if (!resendApiKey)
    throw createError({ statusCode: 500, statusMessage: 'RESEND_API_KEY is not set' })
  cachedResend = new Resend(resendApiKey)
  return cachedResend
}
