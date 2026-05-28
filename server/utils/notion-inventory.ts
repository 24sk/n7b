import type { PageObjectResponse, RichTextItemResponse, UpdatePageParameters } from '@notionhq/client'
import type { ProductCategory } from '~~/shared/types/product'
import { isFullPage } from '@notionhq/client'
import { useNotion } from './notion'

export interface InventoryRow {
  pageId: string
  slug: string
  stripeProductId: string
  name: string
  category: ProductCategory | null
  stock: number
  initialStock: number
}

let cachedDataSourceId: string | null = null

async function resolveDataSourceId(): Promise<string> {
  if (cachedDataSourceId)
    return cachedDataSourceId
  const { notionInventoryDbId } = useRuntimeConfig()
  if (!notionInventoryDbId)
    throw createError({ statusCode: 500, statusMessage: 'NOTION_INVENTORY_DB_ID is not set' })
  const notion = useNotion()
  const db = await notion.databases.retrieve({ database_id: notionInventoryDbId })
  if (!('data_sources' in db) || !db.data_sources.length)
    throw createError({ statusCode: 500, statusMessage: `Notion inventory DB ${notionInventoryDbId} has no data sources` })
  cachedDataSourceId = db.data_sources[0]!.id
  return cachedDataSourceId
}

function richTextPlain(rt: RichTextItemResponse[]): string {
  return rt.map(r => r.plain_text).join('').trim()
}

function pageToRow(page: PageObjectResponse): InventoryRow | null {
  const props = page.properties
  const slugProp = props.Slug
  if (!slugProp || slugProp.type !== 'title')
    return null
  const slug = richTextPlain(slugProp.title)
  if (!slug)
    return null

  const idProp = props['Stripe Product ID']
  const stripeProductId = idProp?.type === 'rich_text' ? richTextPlain(idProp.rich_text) : ''

  const nameProp = props['商品名']
  const name = nameProp?.type === 'rich_text' ? richTextPlain(nameProp.rich_text) : ''

  const catProp = props['カテゴリ']
  const category = catProp?.type === 'select' && catProp.select
    ? (catProp.select.name as ProductCategory)
    : null

  const stockProp = props['在庫数']
  const stock = stockProp?.type === 'number' && typeof stockProp.number === 'number'
    ? stockProp.number
    : 0

  const initialProp = props['初期在庫']
  const initialStock = initialProp?.type === 'number' && typeof initialProp.number === 'number'
    ? initialProp.number
    : 0

  return { pageId: page.id, slug, stripeProductId, name, category, stock, initialStock }
}

/** 全在庫を取得。SOLD OUT 判定や商品一覧への join に利用する。 */
export async function fetchAllStock(): Promise<InventoryRow[]> {
  const notion = useNotion()
  const dataSourceId = await resolveDataSourceId()
  const rows: InventoryRow[] = []
  let cursor: string | undefined
  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
    })
    for (const page of response.results) {
      if (!isFullPage(page))
        continue
      const row = pageToRow(page)
      if (row)
        rows.push(row)
    }
    cursor = response.next_cursor ?? undefined
  } while (cursor)
  return rows
}

/** slug 指定で在庫行を 1 件取得。存在しなければ null。 */
export async function getStockBySlug(slug: string): Promise<InventoryRow | null> {
  const notion = useNotion()
  const dataSourceId = await resolveDataSourceId()
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
    filter: { property: 'Slug', title: { equals: slug } },
  })
  const page = response.results.find(isFullPage)
  if (!page)
    return null
  return pageToRow(page)
}

/**
 * 在庫を `by` だけ減らす。負の在庫は許容 (運用方針)。
 * 競合は楽観制御で、マイナス検知時に呼び元が `flagShortage` を立てる。
 */
export async function decrementStock(slug: string, by: number): Promise<InventoryRow> {
  const row = await getStockBySlug(slug)
  if (!row)
    throw createError({ statusCode: 404, statusMessage: `Inventory row not found for slug "${slug}"` })
  const newStock = row.stock - by
  const notion = useNotion()
  const properties: UpdatePageParameters['properties'] = {
    在庫数: { number: newStock },
  }
  await notion.pages.update({ page_id: row.pageId, properties })
  return { ...row, stock: newStock }
}

/** 在庫を `by` だけ戻す (返金 / Konbini 期限切れ時の引き当て解除)。 */
export async function incrementStock(slug: string, by: number): Promise<InventoryRow> {
  return decrementStock(slug, -by)
}

/** 「要対応」フラグを立てる。在庫マイナス検知時の運用通知用。 */
export async function flagShortage(slug: string): Promise<void> {
  const row = await getStockBySlug(slug)
  if (!row)
    throw createError({ statusCode: 404, statusMessage: `Inventory row not found for slug "${slug}"` })
  const notion = useNotion()
  const properties: UpdatePageParameters['properties'] = {
    要対応: { checkbox: true },
  }
  await notion.pages.update({ page_id: row.pageId, properties })
}
