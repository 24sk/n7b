import { z } from 'zod'
import { setContactSubscribed } from '~~/server/utils/newsletter'
import { renderWelcomeEmail } from '~~/server/utils/newsletterEmail'
import { createNewsletterToken, verifyNewsletterToken } from '~~/server/utils/newsletterToken'
import { useResend } from '~~/server/utils/resend'

const schema = z.object({
  token: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  const payload = verifyNewsletterToken(body.token, 'confirm')
  if (!payload) {
    throw createError({
      statusCode: 400,
      statusMessage: '確認リンクが無効または期限切れです。再度メルマガ登録をお試しください。',
    })
  }

  await setContactSubscribed(payload.email)

  // Welcome メール送信 (失敗しても confirm 成功は返す)
  const { newsletterFrom, public: { siteUrl } } = useRuntimeConfig()
  const unsubscribeToken = createNewsletterToken(payload.email, 'unsubscribe')
  const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`

  try {
    const { subject, text, html } = renderWelcomeEmail(unsubscribeUrl)
    const resend = useResend()
    await resend.emails.send({
      from: `N7B <${newsletterFrom}>`,
      to: payload.email,
      subject,
      text,
      html,
    })
  }
  catch (err) {
    console.error('[newsletter/confirm] Welcome mail failed', err)
  }

  return { ok: true, email: payload.email }
})
