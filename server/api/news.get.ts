import { queryPublishedNews } from '~~/server/utils/notion'

const fetchNews = () => queryPublishedNews(50)

export default import.meta.dev
  ? defineEventHandler(fetchNews)
  : defineCachedEventHandler(fetchNews, {
      maxAge: 60 * 10,
      staleMaxAge: 60 * 60,
      swr: true,
      name: 'news-list',
      getKey: () => 'all',
    })
