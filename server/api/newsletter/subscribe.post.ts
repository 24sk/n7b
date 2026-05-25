import { z } from 'zod'
import { upsertPendingContact } from '~~/server/utils/newsletter'
import { renderConfirmationEmail } from '~~/server/utils/newsletterEmail'
import { createNewsletterToken } from '~~/server/utils/newsletterToken'
import { useResend } from '~~/server/utils/resend'

const schema = z.object({
  email: z.string().trim().email('有効なメールアドレスを入力してください').max(254),
  turnstileToken: z.string().min(1, 'スパム対策の検証が完了していません'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)

  const turnstile = await verifyTurnstileToken(body.turnstileToken)
  if (!turnstile.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Turnstile verification failed',
    })
  }

  await upsertPendingContact(body.email)

  const { newsletterFrom, public: { siteUrl } } = useRuntimeConfig()
  const token = createNewsletterToken(body.email, 'confirm')
  const confirmUrl = `${siteUrl}/newsletter/confirm?token=${encodeURIComponent(token)}`

  const { subject, text, html } = renderConfirmationEmail(confirmUrl)
  const resend = useResend()
  const sent = await resend.emails.send({
    from: `N7B <${newsletterFrom}>`,
    to: body.email,
    subject,
    text,
    html,
  })
  if (sent.error) {
    console.error('[newsletter/subscribe] Resend send failed', sent.error)
    throw createError({
      statusCode: 502,
      statusMessage: '確認メールの送信に失敗しました。時間をおいて再度お試しください。',
    })
  }

  return { ok: true }
})
