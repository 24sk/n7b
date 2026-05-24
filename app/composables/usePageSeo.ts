interface PageSeoOptions {
  /** ページ固有のタイトル (titleTemplate で "| 南湖7丁目ベース" が付与される) */
  title?: string
  description: string
  /** 当該ページの絶対 URL (OGP の og:url 用)。省略時は app.vue の既定値 */
  path?: string
}

const SITE_NAME = '南湖7丁目ベース'
const SITE_URL = 'https://nango7base.jp'

/**
 * ページ固有のメタ情報を一括設定する。
 * - title / description は通常の meta
 * - og:title / twitter:title はサイト名サフィックス付き
 * - og:description / twitter:description は description と同じ
 */
export function usePageSeo({ title, description, path }: PageSeoOptions) {
  const ogTitle = title ? `${title} | ${SITE_NAME}` : `N7B — ${SITE_NAME}`
  const ogUrl = path ? `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}` : SITE_URL

  useSeoMeta({
    title,
    description,
    ogTitle,
    ogDescription: description,
    ogUrl,
    twitterTitle: ogTitle,
    twitterDescription: description,
  })
}
