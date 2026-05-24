export type NewsCategory = 'お知らせ' | 'イベント' | '制作' | 'リリース'

export interface NewsListItem {
  id: string
  slug: string
  title: string
  publishedAt: string
  category: NewsCategory
}

export interface NewsRichText {
  text: string
  href?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
}

export type NewsBlock =
  | { type: 'heading_1' | 'heading_2' | 'heading_3', text: NewsRichText[] }
  | { type: 'paragraph', text: NewsRichText[] }
  | { type: 'bulleted_list_item' | 'numbered_list_item', text: NewsRichText[] }
  | { type: 'quote', text: NewsRichText[] }
  | { type: 'image', url: string, alt: string }
  | { type: 'divider' }
  | { type: 'code', text: NewsRichText[], language?: string }

export interface NewsDetail extends NewsListItem {
  blocks: NewsBlock[]
}
