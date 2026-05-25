/*
 * メルマガ Broadcast 用 HTML テンプレート。
 * Resend Broadcasts API に渡す HTML を生成する。
 * 配信時、Resend が `{{{RESEND_UNSUBSCRIBE_URL}}}` を受信者ごとの解除 URL に置換する。
 */

const SITE_NAME = '南湖7丁目ベース'
const SITE_URL = 'https://nango7base.jp'
const UNSUBSCRIBE_PLACEHOLDER = '{{{RESEND_UNSUBSCRIBE_URL}}}'

export type BroadcastBlock =
  | { type: 'heading', text: string }
  | { type: 'paragraph', text: string }
  | { type: 'link', text: string, href: string }
  | { type: 'image', src: string, alt: string }
  | { type: 'divider' }

export interface BroadcastInput {
  /** メール件名 (Resend Broadcasts の subject に渡す) */
  subject: string
  /** プリヘッダ (受信箱のプレビューに表示) */
  preheader?: string
  /** 本文ブロック */
  blocks: BroadcastBlock[]
}

export interface BroadcastRender {
  subject: string
  html: string
  text: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderBlockHtml(block: BroadcastBlock): string {
  switch (block.type) {
    case 'heading':
      return `<h2 style="margin:32px 0 12px; font-size:18px; color:#1a1f1f;">${escapeHtml(block.text)}</h2>`
    case 'paragraph':
      return `<p style="margin:0 0 16px;">${escapeHtml(block.text)}</p>`
    case 'link':
      return `<p style="margin:0 0 16px;"><a href="${escapeHtml(block.href)}" style="color:#1a7a87;">${escapeHtml(block.text)}</a></p>`
    case 'image':
      return `<p style="margin:24px 0;"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" style="max-width:100%; height:auto; border-radius:4px;"></p>`
    case 'divider':
      return `<hr style="margin:24px 0; border:none; border-top:1px solid #f0f2f2;">`
  }
}

function renderBlockText(block: BroadcastBlock): string {
  switch (block.type) {
    case 'heading':
      return `\n## ${block.text}\n`
    case 'paragraph':
      return block.text
    case 'link':
      return `${block.text}: ${block.href}`
    case 'image':
      return `[画像: ${block.alt}]`
    case 'divider':
      return '\n---\n'
  }
}

export function renderBroadcastTemplate(input: BroadcastInput): BroadcastRender {
  const bodyHtml = input.blocks.map(renderBlockHtml).join('\n')
  const preheaderHtml = input.preheader
    ? `<div style="display:none; max-height:0; overflow:hidden;">${escapeHtml(input.preheader)}</div>`
    : ''

  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0; padding:0; background:#fafbfb; font-family: 'Hiragino Sans','Yu Gothic UI',sans-serif; color:#3d4747; line-height:1.7;">
  ${preheaderHtml}
  <div style="max-width:600px; margin:0 auto; padding:32px 24px;">
    <header style="padding-bottom:24px; border-bottom:1px solid #f0f2f2;">
      <a href="${SITE_URL}" style="text-decoration:none;">
        <span style="font-family: Inter, 'Hiragino Sans', sans-serif; font-size:20px; font-weight:700; letter-spacing:0.05em; color:#1a7a87;">N7B</span>
        <span style="font-size:14px; color:#7a8585; font-weight:500; margin-left:8px;">— ${escapeHtml(SITE_NAME)}</span>
      </a>
    </header>

    <main style="padding:24px 0;">
      ${bodyHtml}
    </main>

    <footer style="margin-top:32px; padding-top:24px; border-top:1px solid #f0f2f2; font-size:12px; color:#7a8585;">
      <p style="margin:0 0 8px;">
        ${escapeHtml(SITE_NAME)} / <a href="${SITE_URL}" style="color:#1a7a87;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
      </p>
      <p style="margin:0;">
        配信停止は
        <a href="${UNSUBSCRIBE_PLACEHOLDER}" style="color:#1a7a87;">こちら</a>
        からいつでも可能です。
      </p>
    </footer>
  </div>
</body>
</html>`

  const textParts = [
    input.preheader,
    '',
    ...input.blocks.map(renderBlockText),
    '',
    '---',
    `${SITE_NAME} / ${SITE_URL}`,
    `配信停止: ${UNSUBSCRIBE_PLACEHOLDER}`,
  ].filter(Boolean) as string[]

  return {
    subject: input.subject,
    html,
    text: textParts.join('\n'),
  }
}
