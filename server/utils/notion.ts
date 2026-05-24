import type {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client'
import type { NewsBlock, NewsDetail, NewsListItem, NewsRichText } from '~~/shared/types/news'
import { Client, isFullPage } from '@notionhq/client'

let cachedClient: Client | null = null

export function useNotion(): Client {
  if (cachedClient)
    return cachedClient
  const { notionApiToken } = useRuntimeConfig()
  if (!notionApiToken)
    throw createError({ statusCode: 500, statusMessage: 'NOTION_API_TOKEN is not set' })
  cachedClient = new Client({ auth: notionApiToken })
  return cachedClient
}

// Notion お知らせ DB のプロパティ名は英語 / 日本語の両方に対応する:
//   title 型: タイトル | Title
//   rich_text 型: スラッグ | Slug (未指定ならページ ID にフォールバック)
//   date 型: 公開日 | PublishedAt
//   select 型: カテゴリ | Category / 公開状態 | Status
function getPlainText(rich: RichTextItemResponse[]): string {
  return rich.map(r => r.plain_text).join('').trim()
}

function getRichText(rich: RichTextItemResponse[]): NewsRichText[] {
  return rich.map(r => ({
    text: r.plain_text,
    href: r.href ?? undefined,
    bold: r.annotations.bold || undefined,
    italic: r.annotations.italic || undefined,
    underline: r.annotations.underline || undefined,
    strikethrough: r.annotations.strikethrough || undefined,
    code: r.annotations.code || undefined,
  }))
}

function pageToListItem(page: PageObjectResponse): NewsListItem | null {
  const props = page.properties
  const titleProp = Object.values(props).find(p => p.type === 'title')
  const slugProp = Object.values(props).find(p => p.type === 'rich_text' && /slug|スラッグ/i.test(getPropertyName(props, p)))
  const dateProp = Object.values(props).find(p => p.type === 'date')
  const categoryProp = Object.values(props).find(p => p.type === 'select' && /category|カテゴリ/i.test(getPropertyName(props, p)))

  if (!titleProp || titleProp.type !== 'title')
    return null
  const title = getPlainText(titleProp.title)
  if (!title)
    return null

  const slug = slugProp && slugProp.type === 'rich_text' && slugProp.rich_text.length
    ? getPlainText(slugProp.rich_text)
    : page.id
  const publishedAt = dateProp && dateProp.type === 'date' && dateProp.date
    ? dateProp.date.start
    : page.created_time
  const category = categoryProp && categoryProp.type === 'select' && categoryProp.select
    ? (categoryProp.select.name as NewsListItem['category'])
    : 'お知らせ'

  return {
    id: page.id,
    slug,
    title,
    publishedAt,
    category,
  }
}

function getPropertyName(
  props: PageObjectResponse['properties'],
  needle: PageObjectResponse['properties'][string],
): string {
  return Object.entries(props).find(([, value]) => value === needle)?.[0] ?? ''
}

interface DataSourceMeta {
  id: string
  slugPropertyName: string | null
}

const dataSourceCache = new Map<string, DataSourceMeta>()

async function resolveDataSource(databaseId: string): Promise<DataSourceMeta> {
  const cached = dataSourceCache.get(databaseId)
  if (cached)
    return cached
  const notion = useNotion()
  const db = await notion.databases.retrieve({ database_id: databaseId })
  if (!('data_sources' in db) || !db.data_sources.length)
    throw createError({ statusCode: 500, statusMessage: `Notion database ${databaseId} has no data sources` })
  const id = db.data_sources[0]!.id

  const ds = await notion.dataSources.retrieve({ data_source_id: id })
  const slugEntry = Object.entries(ds.properties).find(
    ([name, p]) => p.type === 'rich_text' && /slug|スラッグ/i.test(name),
  )
  const meta: DataSourceMeta = { id, slugPropertyName: slugEntry?.[0] ?? null }
  dataSourceCache.set(databaseId, meta)
  return meta
}

export async function queryPublishedNews(limit = 20): Promise<NewsListItem[]> {
  const { notionNewsDbId } = useRuntimeConfig()
  if (!notionNewsDbId)
    throw createError({ statusCode: 500, statusMessage: 'NOTION_NEWS_DB_ID is not set' })

  const notion = useNotion()
  const { id: dataSourceId } = await resolveDataSource(notionNewsDbId)
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: limit,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  })

  const items: NewsListItem[] = []
  for (const page of response.results) {
    if (!isFullPage(page))
      continue
    if (!isPublished(page))
      continue
    const item = pageToListItem(page)
    if (item)
      items.push(item)
  }
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  return items
}

function isPublished(page: PageObjectResponse): boolean {
  const statusProp = Object.values(page.properties).find(
    p => p.type === 'status' || (p.type === 'select' && /status|状態|公開/i.test(getPropertyName(page.properties, p))),
  )
  if (!statusProp)
    return true
  if (statusProp.type === 'status')
    return /publish|公開/i.test(statusProp.status?.name ?? '')
  if (statusProp.type === 'select')
    return /publish|公開/i.test(statusProp.select?.name ?? '')
  return true
}

export async function findNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const { notionNewsDbId } = useRuntimeConfig()
  if (!notionNewsDbId)
    throw createError({ statusCode: 500, statusMessage: 'NOTION_NEWS_DB_ID is not set' })

  const notion = useNotion()
  const { id: dataSourceId, slugPropertyName } = await resolveDataSource(notionNewsDbId)

  let page: PageObjectResponse | null = null
  if (slugPropertyName) {
    const result = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 1,
      filter: {
        property: slugPropertyName,
        rich_text: { equals: slug },
      },
    })
    page = result.results.find(isFullPage) ?? null
  }

  // Slug プロパティ未定義、または slug が見つからない場合: ページ ID 完全一致
  if (!page) {
    try {
      const candidate = await notion.pages.retrieve({ page_id: slug })
      if (isFullPage(candidate))
        page = candidate
    }
    catch {
      // ignore
    }
  }

  if (!page || !isPublished(page))
    return null

  const listItem = pageToListItem(page)
  if (!listItem)
    return null

  const blocks = await fetchPageBlocks(page.id)
  return { ...listItem, blocks }
}

async function fetchPageBlocks(pageId: string): Promise<NewsBlock[]> {
  const notion = useNotion()
  const blocks: NewsBlock[] = []
  let cursor: string | undefined

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    })
    for (const raw of response.results) {
      if (!('type' in raw))
        continue
      const mapped = mapBlock(raw as BlockObjectResponse)
      if (mapped)
        blocks.push(mapped)
    }
    cursor = response.next_cursor ?? undefined
  } while (cursor)

  return blocks
}

function mapBlock(block: BlockObjectResponse): NewsBlock | null {
  switch (block.type) {
    case 'paragraph':
      return { type: 'paragraph', text: getRichText(block.paragraph.rich_text) }
    case 'heading_1':
      return { type: 'heading_1', text: getRichText(block.heading_1.rich_text) }
    case 'heading_2':
      return { type: 'heading_2', text: getRichText(block.heading_2.rich_text) }
    case 'heading_3':
      return { type: 'heading_3', text: getRichText(block.heading_3.rich_text) }
    case 'bulleted_list_item':
      return { type: 'bulleted_list_item', text: getRichText(block.bulleted_list_item.rich_text) }
    case 'numbered_list_item':
      return { type: 'numbered_list_item', text: getRichText(block.numbered_list_item.rich_text) }
    case 'quote':
      return { type: 'quote', text: getRichText(block.quote.rich_text) }
    case 'divider':
      return { type: 'divider' }
    case 'image': {
      const file = block.image
      const url = file.type === 'external' ? file.external.url : file.file.url
      const alt = getPlainText(file.caption) || ''
      return { type: 'image', url, alt }
    }
    case 'code':
      return { type: 'code', text: getRichText(block.code.rich_text), language: block.code.language }
    default:
      return null
  }
}
