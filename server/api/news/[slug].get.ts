import { findNewsBySlug } from '~~/server/utils/notion'

async function fetchNewsBySlug(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) {
  const slug = getRouterParam(event, 'slug')
  if (!slug)
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })

  const news = await findNewsBySlug(slug)
  if (!news)
    throw createError({ statusCode: 404, statusMessage: 'News not found' })

  return news
}

export default import.meta.dev
  ? defineEventHandler(fetchNewsBySlug)
  : defineCachedEventHandler(fetchNewsBySlug, {
      maxAge: 60 * 10,
      staleMaxAge: 60 * 60,
      swr: true,
      name: 'news-detail',
      getKey: event => getRouterParam(event, 'slug') ?? '',
    })
