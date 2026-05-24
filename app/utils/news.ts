import type { NewsCategory } from '~~/shared/types/news'

export function formatNewsDate(isoOrDate: string): string {
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime()))
    return isoOrDate
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

export function isRecent(isoOrDate: string, days = 14): boolean {
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime()))
    return false
  const diff = Date.now() - d.getTime()
  return diff >= 0 && diff < days * 24 * 60 * 60 * 1000
}

export const newsCategoryClass: Record<NewsCategory, string> = {
  お知らせ: 'bg-teal-100 text-teal-700',
  イベント: 'bg-accent-yellow/20 text-category-event-text',
  制作: 'bg-category-production-bg text-category-production-text',
  リリース: 'bg-category-release-bg text-category-release-text',
}
