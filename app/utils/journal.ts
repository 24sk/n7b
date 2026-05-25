import type { JournalCategory } from '~~/shared/types/journal'

export const journalCategoryClass: Record<JournalCategory, string> = {
  制作: 'bg-category-production-bg text-category-production-text',
  リサーチ: 'bg-teal-100 text-teal-700',
  雑記: 'bg-neutral-100 text-neutral-700',
}
