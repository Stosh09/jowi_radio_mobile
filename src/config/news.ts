export type NewsCategory = 'Breaking' | 'Community' | 'Sports' | 'Weather' | 'Bulletin'
export type NewsStatus = 'draft' | 'live' | 'archived'

export interface NewsItem {
  id: string
  headline: string
  summary: string
  body: string
  category: NewsCategory
  updatedAt: string
  readTime: string
  status?: NewsStatus
  priority?: number
  startsAt?: string | null
  endsAt?: string | null
  /** Supabase Storage path in bucket `booth-news` */
  attachmentPath?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
}

export const NEWS_ATTACHMENT_BUCKET = 'booth-news'
export const NEWS_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

export const NEWS_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg,image/webp'

const ALLOWED_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
])

export function isAllowedNewsAttachment(file: File): string | null {
  if (file.size > NEWS_ATTACHMENT_MAX_BYTES) {
    return 'File must be 10 MB or smaller.'
  }
  const mime = file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  const okExt = ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp'].includes(ext ?? '')
  if (mime && ALLOWED_ATTACHMENT_MIME.has(mime)) return null
  if (!mime && okExt) return null
  if (okExt) return null
  return 'Use PDF, Word, text, or image files only.'
}

/** Rough on-air read estimate from body length (~140 wpm spoken). */
export function estimateReadTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  const seconds = Math.max(20, Math.round((words / 140) * 60))
  if (seconds < 60) return `${seconds} sec`
  const mins = Math.floor(seconds / 60)
  const rem = seconds % 60
  return rem === 0 ? `${mins} min` : `${mins}m ${rem}s`
}

/**
 * Offline fallback when Supabase cannot be reached.
 * Keep empty in production — live bulletins come from the booth desk / DB.
 */
export const PRESENTER_NEWS: NewsItem[] = []

const CATEGORY_RANK: Record<NewsCategory, number> = {
  Breaking: 0,
  Community: 1,
  Sports: 2,
  Weather: 3,
  Bulletin: 4,
}

/** Breaking first, then priority, then newest. */
export function sortNewsForAir(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const cat = CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category]
    if (cat !== 0) return cat
    const pri = (b.priority ?? 0) - (a.priority ?? 0)
    if (pri !== 0) return pri
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}
