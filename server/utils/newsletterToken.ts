import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'

export type NewsletterTokenType = 'confirm' | 'unsubscribe'

interface TokenPayload {
  email: string
  type: NewsletterTokenType
  exp: number
}

const CONFIRM_TTL_SEC = 24 * 60 * 60 // 24h
const UNSUBSCRIBE_TTL_SEC = 365 * 24 * 60 * 60 // 1y (配信解除リンクは長期有効)

function getSecret(): string {
  const { newsletterTokenSecret } = useRuntimeConfig()
  if (!newsletterTokenSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NEWSLETTER_TOKEN_SECRET is not set',
    })
  }
  return newsletterTokenSecret
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createNewsletterToken(email: string, type: NewsletterTokenType): string {
  const ttl = type === 'confirm' ? CONFIRM_TTL_SEC : UNSUBSCRIBE_TTL_SEC
  const payload: TokenPayload = {
    email: email.toLowerCase(),
    type,
    exp: Math.floor(Date.now() / 1000) + ttl,
  }
  const encoded = base64url(JSON.stringify(payload))
  const signature = sign(encoded, getSecret())
  return `${encoded}.${signature}`
}

export function verifyNewsletterToken(
  token: string,
  expectedType: NewsletterTokenType,
): TokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2)
    return null
  const [encoded, signature] = parts as [string, string]
  if (!encoded || !signature)
    return null

  const expected = sign(encoded, getSecret())
  const sigBuf = Buffer.from(signature, 'base64url')
  const expBuf = Buffer.from(expected, 'base64url')
  if (sigBuf.length !== expBuf.length)
    return null
  if (!timingSafeEqual(sigBuf, expBuf))
    return null

  let payload: TokenPayload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  }
  catch {
    return null
  }

  if (payload.type !== expectedType)
    return null
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000))
    return null
  if (typeof payload.email !== 'string' || !payload.email)
    return null

  return payload
}
