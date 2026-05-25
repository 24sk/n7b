#!/usr/bin/env tsx
/*
 * メルマガテスト配信スクリプト (3-18)
 *
 * Resend Broadcasts API を使い、サンプル本文の Broadcast を **下書き** で作成する。
 * 作成された Broadcast は Resend Dashboard で内容確認 → 手動送信する想定。
 *
 * 使い方:
 *   pnpm tsx scripts/send-test-broadcast.ts
 *
 * 必要な環境変数:
 *   RESEND_API_KEY        — Resend API キー
 *   RESEND_AUDIENCE_ID    — 対象 Audience の ID
 */
import process from 'node:process'
import { Resend } from 'resend'
import { renderBroadcastTemplate } from '../server/utils/newsletterBroadcast'

async function main() {
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!apiKey) {
    console.error('RESEND_API_KEY が設定されていません')
    process.exit(1)
  }
  if (!audienceId) {
    console.error('RESEND_AUDIENCE_ID が設定されていません')
    process.exit(1)
  }

  const { subject, html, text } = renderBroadcastTemplate({
    subject: '【N7B】テスト配信です',
    preheader: 'メルマガ配信フローの動作確認です',
    blocks: [
      { type: 'heading', text: 'はじめてのメルマガ配信テスト' },
      {
        type: 'paragraph',
        text: 'これは Resend Broadcasts API を使った配信フローの動作確認用メールです。実際の配信ではここに今月のお知らせや制作の裏側が入ります。',
      },
      { type: 'divider' },
      { type: 'heading', text: 'チェックポイント' },
      { type: 'paragraph', text: '・件名・プリヘッダーが受信箱で正しく見えるか' },
      { type: 'paragraph', text: '・ロゴ・本文・フッターのレイアウトが崩れていないか' },
      { type: 'paragraph', text: '・配信停止リンクをクリックすると Resend Audience から外れるか' },
      { type: 'divider' },
      {
        type: 'link',
        text: 'N7B サイトを開く',
        href: 'https://nango7base.jp',
      },
    ],
  })

  const resend = new Resend(apiKey)
  const res = await resend.broadcasts.create({
    audienceId,
    from: 'N7B <noreply@nango7base.jp>',
    subject,
    html,
    text,
    name: `test-${new Date().toISOString().slice(0, 19)}`,
    previewText: 'メルマガ配信フローの動作確認です',
  })

  if (res.error) {
    console.error('Broadcast 作成失敗:', res.error)
    process.exit(1)
  }

  console.log('✓ Broadcast を下書きとして作成しました')
  console.log(`  ID: ${res.data?.id}`)
  console.log('  Resend Dashboard で内容を確認し、送信してください:')
  console.log('  https://resend.com/broadcasts')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
