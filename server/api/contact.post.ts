import { z } from 'zod'
import { createContactRecord, renderContactEmail } from '~~/server/utils/contact'
import { useResend } from '~~/server/utils/resend'

const contactSchema = z.object({
  name: z.string().trim().min(1, 'お名前を入力してください').max(100),
  email: z.string().trim().email('有効なメールアドレスを入力してください').max(254),
  company: z.string().trim().max(200).optional().default(''),
  subject: z.enum(['work', 'workshop', 'other']),
  message: z.string().trim().min(10, 'お問い合わせ内容は10文字以上で入力してください').max(4000),
  consent: z.literal(true, { message: 'プライバシーポリシーへの同意が必要です' }),
  turnstileToken: z.string().min(1, 'スパム対策の検証が完了していません'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, contactSchema.parse)

  const turnstile = await verifyTurnstileToken(body.turnstileToken)
  if (!turnstile.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Turnstile verification failed',
    })
  }

  const payload = {
    name: body.name,
    email: body.email,
    company: body.company,
    subject: body.subject,
    message: body.message,
  }

  // Notion 登録は失敗しても継続 (メール通知で落ちこぼしを防ぐ)
  let notionId: string | null = null
  try {
    const record = await createContactRecord(payload)
    notionId = record?.id ?? null
  }
  catch (err) {
    console.error('[contact] Notion sync failed', err)
  }

  // メール通知: Resend が落ちている場合は 502 で返してユーザにリトライさせる
  const { contactNotificationTo, contactNotificationFrom } = useRuntimeConfig()
  const { subject, text, html } = renderContactEmail(payload)
  try {
    const resend = useResend()
    await resend.emails.send({
      from: `N7B Contact <${contactNotificationFrom}>`,
      to: contactNotificationTo,
      replyTo: payload.email,
      subject,
      text,
      html,
    })
  }
  catch (err) {
    console.error('[contact] Resend send failed', err)
    if (!notionId) {
      throw createError({
        statusCode: 502,
        statusMessage: 'お問い合わせの送信に失敗しました。時間をおいて再度お試しください。',
      })
    }
  }

  return { ok: true, notionId }
})
