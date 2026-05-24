import type { CreatePageParameters } from '@notionhq/client'
import { useNotion } from './notion'

export interface ContactPayload {
  name: string
  email: string
  company?: string
  subject: 'work' | 'workshop' | 'other'
  message: string
}

const subjectLabel: Record<ContactPayload['subject'], string> = {
  work: 'お仕事のご相談・開発依頼',
  workshop: 'ワークショップ・イベント',
  other: 'その他',
}

// Notion お問い合わせ DB に期待するプロパティ:
//   Name (title) / Email (email) / Company (rich_text) /
//   Subject (select) / Message (rich_text)
export async function createContactRecord(payload: ContactPayload): Promise<{ id: string } | null> {
  const { notionContactDbId } = useRuntimeConfig()
  if (!notionContactDbId) {
    console.warn('[contact] NOTION_CONTACT_DB_ID is not set, skipping Notion sync')
    return null
  }

  const notion = useNotion()
  const properties: CreatePageParameters['properties'] = {
    Name: {
      title: [{ text: { content: payload.name } }],
    },
    Email: {
      email: payload.email,
    },
    Company: {
      rich_text: [{ text: { content: payload.company ?? '' } }],
    },
    Subject: {
      select: { name: subjectLabel[payload.subject] },
    },
    Message: {
      rich_text: [{ text: { content: payload.message.slice(0, 2000) } }],
    },
  }

  const page = await notion.pages.create({
    parent: { database_id: notionContactDbId },
    properties,
  })
  return { id: page.id }
}

export function renderContactEmail(payload: ContactPayload): { subject: string, text: string, html: string } {
  const subjectText = subjectLabel[payload.subject]
  const subject = `[N7B Contact] ${subjectText} — ${payload.name} 様`
  const lines = [
    'N7B のお問い合わせフォームから新しい連絡が届きました。',
    '',
    `お名前: ${payload.name}`,
    `メール: ${payload.email}`,
    `会社/団体: ${payload.company || '(未入力)'}`,
    `種別: ${subjectText}`,
    '',
    'お問い合わせ内容:',
    payload.message,
  ]
  const text = lines.join('\n')
  const escapeHtml = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  const html = `<pre style="font-family: 'Hiragino Sans','Yu Gothic UI',sans-serif; line-height:1.7; white-space:pre-wrap;">${escapeHtml(text)}</pre>`
  return { subject, text, html }
}
