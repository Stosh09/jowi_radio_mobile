import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  estimateReadTime,
  NEWS_ATTACHMENT_BUCKET,
  PRESENTER_NEWS,
  sortNewsForAir,
  type NewsCategory,
  type NewsItem,
  type NewsStatus,
} from '@shared/news'
import { readAttachmentBytes, validateAttachment, type PickedAttachment } from '../lib/attachments'
import { openInApp } from '../lib/contact'
import { KEYS, readCache, writeCache } from '../lib/storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export interface NewsDraftInput {
  headline: string
  summary: string
  body: string
  category: NewsCategory
  status: NewsStatus
  priority?: number
  startsAt?: string | null
  endsAt?: string | null
  file?: PickedAttachment | null
  clearAttachment?: boolean
}

type Result = { ok: boolean; error?: string }

interface NewsApi {
  live: NewsItem[]
  drafts: NewsItem[]
  backendReady: boolean
  usingFallback: boolean
  cachedAt: string | null
  createBulletin: (input: NewsDraftInput) => Promise<Result>
  updateBulletin: (id: string, input: Partial<NewsDraftInput>) => Promise<Result>
  setStatus: (id: string, status: NewsStatus) => Promise<Result>
  openAttachment: (item: NewsItem) => Promise<boolean>
  refresh: () => Promise<void>
}

interface NewsRow {
  id: string
  headline: string
  summary: string
  body: string
  category: NewsCategory
  status: NewsStatus
  priority: number
  starts_at: string | null
  ends_at: string | null
  attachment_path: string | null
  attachment_name: string | null
  attachment_mime: string | null
  updated_at: string
}

const NewsContext = createContext<NewsApi | null>(null)
const SELECT_COLS =
  'id, headline, summary, body, category, status, priority, starts_at, ends_at, attachment_path, attachment_name, attachment_mime, updated_at'

function mapRow(row: NewsRow): NewsItem {
  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary,
    body: row.body,
    category: row.category,
    status: row.status,
    priority: row.priority,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    attachmentPath: row.attachment_path,
    attachmentName: row.attachment_name,
    attachmentMime: row.attachment_mime,
    updatedAt: row.updated_at,
    readTime: estimateReadTime(row.body),
  }
}

function inWindow(item: NewsItem, now = Date.now()): boolean {
  if (item.startsAt) {
    const start = Date.parse(item.startsAt)
    if (!Number.isNaN(start) && now < start) return false
  }
  if (item.endsAt) {
    const end = Date.parse(item.endsAt)
    if (!Number.isNaN(end) && now > end) return false
  }
  return true
}

const safeFileName = (name: string) => name.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120)

async function removeStoragePath(path: string | null | undefined) {
  if (!supabase || !path) return
  await supabase.storage.from(NEWS_ATTACHMENT_BUCKET).remove([path])
}

async function uploadAttachment(bulletinId: string, file: PickedAttachment, previousPath?: string | null) {
  if (!supabase) return { ok: false as const, message: 'Supabase not configured' }
  const check = validateAttachment(file)
  if (check) return { ok: false as const, message: check }

  const path = `${bulletinId}/${Date.now()}-${safeFileName(file.name)}`
  const bytes = await readAttachmentBytes(file)
  const { error: upErr } = await supabase.storage.from(NEWS_ATTACHMENT_BUCKET).upload(path, bytes, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.mimeType || undefined,
  })
  if (upErr) {
    const rls = /row-level security|policy|not authorized|403/i.test(upErr.message)
    return {
      ok: false as const,
      message: rls
        ? 'Upload blocked — attachments need the confirmed booth Auth user (see docs/BOOTH.md).'
        : `Upload failed: ${upErr.message}`,
    }
  }

  const { error: dbErr } = await supabase
    .from('news_bulletins')
    .update({
      attachment_path: path,
      attachment_name: file.name,
      attachment_mime: file.mimeType || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bulletinId)
  if (dbErr) {
    await removeStoragePath(path)
    return { ok: false as const, message: `Could not save attachment info: ${dbErr.message}` }
  }
  if (previousPath && previousPath !== path) await removeStoragePath(previousPath)
  return { ok: true as const }
}

export function NewsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [usingFallback, setUsingFallback] = useState(!isSupabaseConfigured)
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const backendReady = isSupabaseConfigured && Boolean(supabase)

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('news_bulletins')
      .select(SELECT_COLS)
      .in('status', ['live', 'draft'])
      .order('updated_at', { ascending: false })

    if (error) {
      const cached = await readCache<NewsItem[]>(KEYS.cacheNews)
      if (cached) {
        setItems(cached.data)
        setCachedAt(cached.savedAt)
      } else {
        setItems(PRESENTER_NEWS)
        setUsingFallback(true)
      }
      return
    }
    const mapped = (data as NewsRow[]).map(mapRow)
    setUsingFallback(false)
    setCachedAt(null)
    setItems(mapped)
    void writeCache(KEYS.cacheNews, mapped)
  }, [])

  useEffect(() => {
    void readCache<NewsItem[]>(KEYS.cacheNews).then((cached) => {
      if (cached) setItems((prev) => (prev.length ? prev : cached.data))
    })
    if (!supabase) return
    const client = supabase
    // Also fires right away with INITIAL_SESSION, which performs the first load.
    const { data: authSub } = client.auth.onAuthStateChange(() => void refresh())
    const channel = client
      .channel('jowi-news-mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_bulletins' }, () => void refresh())
      .subscribe()
    return () => {
      authSub.subscription.unsubscribe()
      void client.removeChannel(channel)
    }
  }, [refresh])

  const live = useMemo(
    () => sortNewsForAir(items.filter((n) => n.status === 'live' && inWindow(n))),
    [items],
  )
  const drafts = useMemo(
    () => sortNewsForAir(items.filter((n) => n.status === 'draft' || (n.status === 'live' && !inWindow(n)))),
    [items],
  )

  const createBulletin = useCallback(
    async (input: NewsDraftInput): Promise<Result> => {
      if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
      const { data, error } = await supabase
        .from('news_bulletins')
        .insert({
          headline: input.headline.trim(),
          summary: input.summary.trim(),
          body: input.body.trim(),
          category: input.category,
          status: input.status,
          priority: input.priority ?? (input.category === 'Breaking' ? 10 : 0),
          starts_at: input.startsAt || null,
          ends_at: input.endsAt || null,
        })
        .select('id')
        .single()
      if (error || !data?.id) {
        return {
          ok: false,
          error: error?.message?.includes('row-level security')
            ? 'Save blocked by RLS. Run supabase/news_anon_write.sql in the SQL Editor.'
            : error?.message || 'Create failed.',
        }
      }
      if (input.file) {
        const up = await uploadAttachment(data.id as string, input.file)
        if (!up.ok) {
          await refresh()
          return { ok: false, error: `Bulletin saved, but: ${up.message}` }
        }
      }
      await refresh()
      return { ok: true }
    },
    [refresh],
  )

  const updateBulletin = useCallback(
    async (id: string, input: Partial<NewsDraftInput>): Promise<Result> => {
      if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
      const existing = items.find((n) => n.id === id)
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (input.headline != null) patch.headline = input.headline.trim()
      if (input.summary != null) patch.summary = input.summary.trim()
      if (input.body != null) patch.body = input.body.trim()
      if (input.category != null) {
        patch.category = input.category
        if (input.priority == null && input.category === 'Breaking') patch.priority = 10
      }
      if (input.status != null) patch.status = input.status
      if (input.priority != null) patch.priority = input.priority
      if (input.startsAt !== undefined) patch.starts_at = input.startsAt || null
      if (input.endsAt !== undefined) patch.ends_at = input.endsAt || null
      if (input.clearAttachment && !input.file) {
        patch.attachment_path = null
        patch.attachment_name = null
        patch.attachment_mime = null
      }

      const { error } = await supabase.from('news_bulletins').update(patch).eq('id', id)
      if (error) {
        return {
          ok: false,
          error: error.message.includes('row-level security')
            ? 'Update blocked by RLS. Run supabase/news_anon_write.sql in the SQL Editor.'
            : error.message,
        }
      }
      if (input.clearAttachment && !input.file) await removeStoragePath(existing?.attachmentPath)
      if (input.file) {
        const up = await uploadAttachment(id, input.file, existing?.attachmentPath)
        if (!up.ok) {
          await refresh()
          return { ok: false, error: `Bulletin saved, but: ${up.message}` }
        }
      }
      await refresh()
      return { ok: true }
    },
    [items, refresh],
  )

  const setStatus = useCallback(
    (id: string, status: NewsStatus) => updateBulletin(id, { status }),
    [updateBulletin],
  )

  const openAttachment = useCallback(async (item: NewsItem) => {
    if (!supabase || !item.attachmentPath) return false
    const { data, error } = await supabase.storage
      .from(NEWS_ATTACHMENT_BUCKET)
      .createSignedUrl(item.attachmentPath, 60 * 60)
    if (error || !data?.signedUrl) return false
    await openInApp(data.signedUrl)
    return true
  }, [])

  const value = useMemo<NewsApi>(
    () => ({
      live,
      drafts,
      backendReady,
      usingFallback,
      cachedAt,
      createBulletin,
      updateBulletin,
      setStatus,
      openAttachment,
      refresh,
    }),
    [live, drafts, backendReady, usingFallback, cachedAt, createBulletin, updateBulletin, setStatus, openAttachment, refresh],
  )

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>
}

export function useNews() {
  const ctx = useContext(NewsContext)
  if (!ctx) throw new Error('useNews must be used within NewsProvider')
  return ctx
}
