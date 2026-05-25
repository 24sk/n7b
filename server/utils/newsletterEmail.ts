const SITE_NAME = '南湖7丁目ベース'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface EmailRender { subject: string, text: string, html: string }

/**
 * 確認メール (ダブルオプトイン用)
 * リンクは 24h 有効。クリックすると Resend Audience の unsubscribed=false に更新される。
 */
export function renderConfirmationEmail(confirmUrl: string): EmailRender {
  const subject = `【${SITE_NAME}】メルマガ登録の確認をお願いします`
  const lines = [
    `${SITE_NAME} のメルマガにご登録いただきありがとうございます。`,
    '',
    '下記のリンクを24時間以内にクリックして、登録を完了してください。',
    '',
    confirmUrl,
    '',
    '心当たりがない場合は、このメールを破棄してください。登録は完了されません。',
    '',
    '— 南湖7丁目ベース',
    'https://nango7base.jp',
  ]
  const text = lines.join('\n')
  const html = `<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#fafbfb; font-family: 'Hiragino Sans','Yu Gothic UI',sans-serif; color:#3d4747; line-height:1.7;">
  <div style="max-width:560px; margin:0 auto; padding:32px 24px;">
    <div style="font-family: Inter, 'Hiragino Sans', sans-serif; font-size:20px; font-weight:700; letter-spacing:0.05em; color:#1a7a87;">
      N7B <span style="font-size:14px; color:#7a8585; font-weight:500;">— ${escapeHtml(SITE_NAME)}</span>
    </div>
    <h1 style="margin-top:32px; font-size:20px; color:#1a1f1f;">メルマガ登録の確認</h1>
    <p style="margin-top:16px;">
      ${escapeHtml(SITE_NAME)} のメルマガにご登録いただきありがとうございます。
    </p>
    <p>下記のボタンを <strong>24時間以内に</strong> クリックして、登録を完了してください。</p>
    <p style="margin:32px 0;">
      <a href="${confirmUrl}" style="display:inline-block; padding:12px 24px; background:#1a7a87; color:#ffffff; text-decoration:none; border-radius:4px; font-weight:500;">
        登録を完了する
      </a>
    </p>
    <p style="font-size:12px; color:#7a8585;">
      ボタンが押せない場合は、以下の URL を直接ブラウザで開いてください:<br>
      <a href="${confirmUrl}" style="color:#1a7a87; word-break:break-all;">${escapeHtml(confirmUrl)}</a>
    </p>
    <hr style="margin:32px 0; border:none; border-top:1px solid #f0f2f2;">
    <p style="font-size:12px; color:#7a8585;">
      心当たりがない場合は、このメールを破棄してください。クリックしない限り登録は完了されません。
    </p>
    <p style="font-size:12px; color:#7a8585; margin-top:24px;">
      ${escapeHtml(SITE_NAME)} / <a href="https://nango7base.jp" style="color:#1a7a87;">nango7base.jp</a>
    </p>
  </div>
</body>
</html>`
  return { subject, text, html }
}

/**
 * 登録完了の歓迎メール (確認リンククリック後に送信)
 */
export function renderWelcomeEmail(unsubscribeUrl: string): EmailRender {
  const subject = `【${SITE_NAME}】メルマガ登録が完了しました`
  const lines = [
    'メルマガ登録が完了しました。ご登録ありがとうございます。',
    '',
    `${SITE_NAME} は、茅ヶ崎・南湖の海辺にある、ものづくり・システム開発・発信のベースキャンプです。`,
    'これから月に1回ほど、プロダクトやイベント、制作の裏側についてお届けします。',
    '',
    '配信を停止したい場合は、以下のリンクからいつでも解除できます:',
    unsubscribeUrl,
    '',
    '— 南湖7丁目ベース',
    'https://nango7base.jp',
  ]
  const text = lines.join('\n')
  const html = `<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#fafbfb; font-family: 'Hiragino Sans','Yu Gothic UI',sans-serif; color:#3d4747; line-height:1.7;">
  <div style="max-width:560px; margin:0 auto; padding:32px 24px;">
    <div style="font-family: Inter, 'Hiragino Sans', sans-serif; font-size:20px; font-weight:700; letter-spacing:0.05em; color:#1a7a87;">
      N7B <span style="font-size:14px; color:#7a8585; font-weight:500;">— ${escapeHtml(SITE_NAME)}</span>
    </div>
    <h1 style="margin-top:32px; font-size:20px; color:#1a1f1f;">メルマガ登録が完了しました</h1>
    <p style="margin-top:16px;">ご登録ありがとうございます。</p>
    <p>
      ${escapeHtml(SITE_NAME)} は、茅ヶ崎・南湖の海辺にある、ものづくり・システム開発・発信のベースキャンプです。
      これから月に1回ほど、プロダクトやイベント、制作の裏側についてお届けします。
    </p>
    <hr style="margin:32px 0; border:none; border-top:1px solid #f0f2f2;">
    <p style="font-size:12px; color:#7a8585;">
      配信停止はいつでも下記のリンクから:<br>
      <a href="${unsubscribeUrl}" style="color:#1a7a87; word-break:break-all;">${escapeHtml(unsubscribeUrl)}</a>
    </p>
    <p style="font-size:12px; color:#7a8585; margin-top:24px;">
      ${escapeHtml(SITE_NAME)} / <a href="https://nango7base.jp" style="color:#1a7a87;">nango7base.jp</a>
    </p>
  </div>
</body>
</html>`
  return { subject, text, html }
}
