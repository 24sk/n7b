import { useResend } from './resend'

function audienceId(): string {
  const { resendAudienceId } = useRuntimeConfig()
  if (!resendAudienceId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'RESEND_AUDIENCE_ID is not set',
    })
  }
  return resendAudienceId
}

function normalize(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * 新規登録: 未確認状態 (unsubscribed=true) で Resend Audience に追加する。
 * 既に存在するメールアドレスの場合は、unsubscribed=true へ更新して再確認フローに乗せる。
 */
export async function upsertPendingContact(email: string): Promise<void> {
  const normalized = normalize(email)
  const resend = useResend()
  const created = await resend.contacts.create({
    audienceId: audienceId(),
    email: normalized,
    unsubscribed: true,
  })
  if (!created.error)
    return

  // 既存メールの場合は update に切り替える。
  // Resend は重複時に validation_error を返す (詳細メッセージは "already exists" 等)。
  if (created.error.name === 'validation_error') {
    const updated = await resend.contacts.update({
      audienceId: audienceId(),
      email: normalized,
      unsubscribed: true,
    })
    if (updated.error) {
      throw createError({
        statusCode: 502,
        statusMessage: `Resend update failed: ${updated.error.message}`,
      })
    }
    return
  }

  throw createError({
    statusCode: 502,
    statusMessage: `Resend create failed: ${created.error.message}`,
  })
}

export async function setContactSubscribed(email: string): Promise<void> {
  const resend = useResend()
  const res = await resend.contacts.update({
    audienceId: audienceId(),
    email: normalize(email),
    unsubscribed: false,
  })
  if (res.error) {
    throw createError({
      statusCode: 502,
      statusMessage: `Resend update failed: ${res.error.message}`,
    })
  }
}

export async function setContactUnsubscribed(email: string): Promise<void> {
  const resend = useResend()
  const res = await resend.contacts.update({
    audienceId: audienceId(),
    email: normalize(email),
    unsubscribed: true,
  })
  if (res.error) {
    // Contact が存在しない場合は黙って無視 (既に解除済み or 未登録)
    if (res.error.name === 'not_found')
      return
    throw createError({
      statusCode: 502,
      statusMessage: `Resend update failed: ${res.error.message}`,
    })
  }
}
