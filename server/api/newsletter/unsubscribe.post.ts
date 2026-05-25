import { z } from 'zod'
import { setContactUnsubscribed } from '~~/server/utils/newsletter'
import { verifyNewsletterToken } from '~~/server/utils/newsletterToken'

const schema = z.object({
  token: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  const payload = verifyNewsletterToken(body.token, 'unsubscribe')
  if (!payload) {
    throw createError({
      statusCode: 400,
      statusMessage: '配信解除リンクが無効です。お手数ですが contact@nango7base.jp までご連絡ください。',
    })
  }

  await setContactUnsubscribed(payload.email)
  return { ok: true, email: payload.email }
})
