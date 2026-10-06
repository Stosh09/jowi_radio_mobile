import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { FileText, Headphones, Maximize2, X } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { ImageCropDialog } from '../components/ImageCropDialog'
import {
  estimateReadTime,
  isAllowedNewsAttachment,
  NEWS_ATTACHMENT_ACCEPT,
  type NewsCategory,
  type NewsItem,
  type NewsStatus,
} from '../config/news'
import { useInteraction, type MessageKind } from '../context/InteractionContext'
import { useNewsBulletins, type NewsDraftInput } from '../context/NewsBulletinContext'
import { usePlayer } from '../context/AudioPlayerContext'
import { usePresenterAuth, type BoothLoginResult } from '../context/PresenterAuthContext'
import { useNowPlaying } from '../hooks/useNowPlaying'
import { extractNewsAttachmentText } from '../lib/extractNewsAttachment'
import { formatSlotStart } from '../lib/scheduleClock'

const USED_KEY = 'jowi-news-used'
const CATEGORIES: NewsCategory[] = ['Breaking', 'Community', 'Sports', 'Weather', 'Bulletin']

type InboxFilter = 'all' | 'flagged' | 'request' | 'shoutout'

function hourBucket(date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
}

function loadUsedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(USED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { hour: string; ids: string[] }
    if (parsed.hour !== hourBucket()) return new Set()
    return new Set(parsed.ids)
  } catch {
    return new Set()
  }
}

function saveUsedIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(
      USED_KEY,
      JSON.stringify({ hour: hourBucket(), ids: [...ids] }),
    )
  } catch {
    /* ignore */
  }
}

export function BoothPage() {
  const { isPresenter, loginWithPin, logout, hasAuthSession, authEmail } = usePresenterAuth()

  if (!isPresenter) {
    return <PresenterLogin onLogin={loginWithPin} />
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-10 md:px-6 md:py-16">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-jowi-live sm:text-xs sm:tracking-[0.22em]">
            Staff only
          </p>
          <h1 className="mt-1 font-display text-3xl uppercase leading-none text-white sm:mt-2 sm:text-4xl md:text-5xl">
            Booth desk
          </h1>
          <p className="mt-2 max-w-xl text-sm text-jowi-muted sm:mt-3 sm:text-base">
            News, inbox, and poll — studio only.
            {hasAuthSession && authEmail ? (
              <span className="mt-1 block text-xs text-jowi-gold">Signed in as {authEmail}</span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="shrink-0 rounded-md border border-white/20 px-3 py-1.5 text-xs text-jowi-muted hover:text-white sm:px-4 sm:py-2 sm:text-sm"
        >
          Sign out
        </button>
      </div>

      <ShowStrip />
      <NewsBoard />
      <BoothInbox />
      <BoothPoll />
    </div>
  )
}

function PresenterLogin({
  onLogin,
}: {
  onLogin: (pin: string) => Promise<BoothLoginResult>
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setWarning(null)
    const result = await onLogin(pin)
    setBusy(false)
    if (!result.ok) {
      setError(result.message || 'Incorrect PIN. Try again.')
      setPin('')
      return
    }
    if (result.message && !result.hasAuth) {
      setWarning(result.message)
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-3 py-10 sm:px-4 sm:py-16">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-jowi-live sm:text-xs sm:tracking-[0.22em]">
        Presenters only
      </p>
      <h1 className="mt-1.5 font-display text-2xl uppercase text-white sm:mt-2 sm:text-3xl">
        Booth login
      </h1>
      <p className="mt-2 text-sm text-jowi-muted sm:mt-3">
        Enter the studio PIN to open the desk. Listeners cannot access this area.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
        <label className="block text-xs uppercase tracking-wider text-jowi-muted">
          Studio PIN
          <input
            type="password"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(null)
            }}
            className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-jowi-gold"
            placeholder="••••••••"
            required
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {warning && <p className="text-sm text-amber-200">{warning}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-jowi-gold px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Enter booth'}
        </button>
      </form>
      <Link to="/" className="mt-5 text-center text-sm text-jowi-muted hover:text-white sm:mt-6">
        ← Back to listening
      </Link>
    </div>
  )
}

function ShowStrip() {
  const { current, upNext } = useNowPlaying()
  const { listeners } = usePlayer()

  return (
    <section className="mt-5 rounded-lg border border-jowi-gold/25 bg-jowi-gold/10 px-3 py-3 sm:mt-8 sm:rounded-xl sm:px-5 sm:py-4">
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
        <div className="col-span-2 min-w-0 sm:col-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-jowi-muted">
            On air now
          </p>
          <p className="font-display text-lg uppercase leading-tight text-white sm:text-xl md:text-2xl">
            {current?.title ?? 'JOWI Live'}
          </p>
          <p className="truncate text-sm text-jowi-muted">with {current?.host ?? 'The booth'}</p>
          {current && (
            <p className="mt-0.5 font-mono text-xs text-jowi-gold">{current.time}</p>
          )}
        </div>
        <div className="hidden h-12 w-px bg-white/15 sm:block" aria-hidden />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-jowi-muted">
            Up next
          </p>
          <p className="truncate text-base text-white sm:text-lg">{upNext?.title ?? '—'}</p>
          <p className="truncate text-xs text-jowi-muted sm:text-sm">
            {upNext
              ? `${formatSlotStart(upNext)} · ${upNext.host}`
              : 'End of published day guide'}
          </p>
        </div>
        <div className="inline-flex items-center justify-self-end gap-1.5 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm text-white sm:ml-auto sm:gap-2 sm:px-3 sm:py-2">
          <Headphones size={16} className="shrink-0 text-jowi-gold" />
          <span className="tabular-nums">{listeners}</span>
          <span className="text-[10px] text-jowi-muted sm:text-xs">listening</span>
        </div>
      </div>
    </section>
  )
}

function NewsBoard() {
  const {
    live,
    drafts,
    backendReady,
    loading,
    createBulletin,
    updateBulletin,
    setStatus,
    openAttachment,
  } = useNewsBulletins()
  const [usedIds, setUsedIds] = useState<Set<string>>(() => loadUsedIds())
  const [focusId, setFocusId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [showDrafts, setShowDrafts] = useState(false)

  const focusItem = useMemo(
    () => live.find((n) => n.id === focusId) ?? drafts.find((n) => n.id === focusId) ?? null,
    [live, drafts, focusId],
  )

  const toggleUsed = (id: string) => {
    setUsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveUsedIds(next)
      return next
    })
  }

  return (
    <section className="mt-7 sm:mt-12">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl uppercase text-white sm:text-2xl">News for air</h2>
          <p className="mt-0.5 text-xs text-jowi-muted sm:mt-1 sm:text-sm">
            Read on air — not on the public site.
            {loading && <span className="ml-1">Refreshing…</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {drafts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDrafts((v) => !v)}
              className="rounded-md border border-white/20 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-jowi-muted hover:text-white sm:px-3 sm:py-2 sm:text-xs"
            >
              {showDrafts ? 'Hide drafts' : `Drafts (${drafts.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            disabled={!backendReady}
            className="rounded-md bg-jowi-gold px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark disabled:opacity-50 sm:px-3 sm:py-2 sm:text-xs"
          >
            Add bulletin
          </button>
        </div>
      </div>

      {!backendReady && (
        <p className="mt-3 text-sm text-jowi-muted sm:mt-4">
          News desk needs a live connection. Check studio network and try again.
        </p>
      )}

      {showForm && (
        <BulletinForm
          key={editing?.id ?? 'new'}
          initial={editing}
          canWrite={backendReady}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSave={async (input) => {
            const result = editing
              ? await updateBulletin(editing.id, input)
              : await createBulletin(input)
            if (result.ok) {
              setShowForm(false)
              setEditing(null)
            }
            return result
          }}
        />
      )}

      <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
        {live.length === 0 ? (
          <p className="text-sm text-jowi-muted">No live bulletins yet. Add one for this shift.</p>
        ) : (
          live.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              used={usedIds.has(item.id)}
              onToggleUsed={() => toggleUsed(item.id)}
              onFocus={() => setFocusId(item.id)}
              onOpenAttachment={() => void openAttachment(item)}
              onEdit={() => {
                setEditing(item)
                setShowForm(true)
              }}
              onArchive={() => void setStatus(item.id, 'archived')}
              canManage={backendReady}
            />
          ))
        )}
      </div>

      {showDrafts && drafts.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-white/10 pt-5 sm:mt-8 sm:space-y-4 sm:pt-8">
          <h3 className="font-display text-base uppercase text-jowi-muted sm:text-lg">
            Drafts / out of window
          </h3>
          {drafts.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              used={false}
              onToggleUsed={() => undefined}
              onFocus={() => setFocusId(item.id)}
              onOpenAttachment={() => void openAttachment(item)}
              onEdit={() => {
                setEditing(item)
                setShowForm(true)
              }}
              onArchive={() => void setStatus(item.id, 'archived')}
              onGoLive={() => void setStatus(item.id, 'live')}
              canManage={backendReady}
              draft
            />
          ))}
        </div>
      )}

      {focusItem && (
        <FocusReader
          item={focusItem}
          onClose={() => setFocusId(null)}
          onOpenAttachment={() => void openAttachment(focusItem)}
        />
      )}
    </section>
  )
}

function NewsCard({
  item,
  used,
  onToggleUsed,
  onFocus,
  onOpenAttachment,
  onEdit,
  onArchive,
  onGoLive,
  canManage,
  draft,
}: {
  item: NewsItem
  used: boolean
  onToggleUsed: () => void
  onFocus: () => void
  onOpenAttachment: () => void
  onEdit: () => void
  onArchive: () => void
  onGoLive?: () => void
  canManage: boolean
  draft?: boolean
}) {
  return (
    <article
      className={`border p-3 sm:p-5 md:p-6 ${
        used
          ? 'border-white/5 bg-black/20 opacity-60'
          : item.category === 'Breaking'
            ? 'border-jowi-live/40 bg-jowi-live/5'
            : 'border-white/10 bg-jowi-card/50'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-wider sm:text-xs">
        <span
          className={
            item.category === 'Breaking'
              ? 'rounded bg-jowi-live px-1.5 py-0.5 font-bold text-white sm:px-2'
              : 'text-jowi-gold'
          }
        >
          {item.category}
        </span>
        {draft && <span className="rounded border border-white/20 px-1.5 py-0.5 text-jowi-muted">Draft</span>}
        {used && (
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-jowi-muted">Used this hour</span>
        )}
        <span className="text-jowi-muted">·</span>
        <span className="text-jowi-muted">{item.readTime} read</span>
        <span className="hidden text-jowi-muted sm:inline">·</span>
        <time className="hidden text-jowi-muted sm:inline" dateTime={item.updatedAt}>
          {new Date(item.updatedAt).toLocaleString()}
        </time>
      </div>
      <h3 className="mt-2 font-display text-lg uppercase leading-tight text-white sm:mt-3 sm:text-xl md:text-2xl">
        {item.headline}
      </h3>
      {item.summary ? (
        <p className="mt-1.5 text-sm font-medium text-jowi-muted sm:mt-2">{item.summary}</p>
      ) : null}
      <p className="mt-2.5 text-sm leading-snug text-jowi-ink sm:mt-4 sm:text-base sm:leading-relaxed">
        {item.body}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 sm:mt-4 sm:gap-3">
        {!draft && (
          <button
            type="button"
            onClick={onToggleUsed}
            className="text-[10px] font-semibold uppercase tracking-wide text-jowi-gold hover:underline sm:text-xs"
          >
            {used ? 'Mark unused' : 'Mark used'}
          </button>
        )}
        <button
          type="button"
          onClick={onFocus}
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white hover:underline sm:text-xs"
        >
          <Maximize2 size={12} /> Focus read
        </button>
        {canManage && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="text-[10px] font-semibold uppercase tracking-wide text-jowi-muted hover:text-white sm:text-xs"
            >
              Edit
            </button>
            {onGoLive && (
              <button
                type="button"
                onClick={onGoLive}
                className="text-[10px] font-semibold uppercase tracking-wide text-jowi-gold hover:underline sm:text-xs"
              >
                Go live
              </button>
            )}
            <button
              type="button"
              onClick={onArchive}
              className="text-[10px] font-semibold uppercase tracking-wide text-jowi-muted hover:text-red-300 sm:text-xs"
            >
              Archive
            </button>
          </>
        )}
      </div>
      {item.attachmentPath && item.attachmentName && (
        <button
          type="button"
          onClick={onOpenAttachment}
          className="mt-2 inline-flex max-w-full items-center gap-2 truncate text-sm text-jowi-gold hover:underline sm:mt-3"
        >
          <FileText size={14} className="shrink-0" />
          <span className="truncate">{item.attachmentName} — Open</span>
        </button>
      )}
    </article>
  )
}

function FocusReader({
  item,
  onClose,
  onOpenAttachment,
}: {
  item: NewsItem
  onClose: () => void
  onOpenAttachment: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 p-0 sm:items-center sm:p-4 md:p-10">
      <div className="relative max-h-[100dvh] w-full max-w-3xl overflow-y-auto rounded-none border-0 border-jowi-gold/30 bg-jowi-bg p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-h-[90vh] sm:rounded-xl sm:border sm:p-6 md:p-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md border border-white/20 p-2 text-jowi-muted hover:text-white sm:right-4 sm:top-4"
          aria-label="Close focus reader"
        >
          <X size={18} />
        </button>
        <p className="pr-10 text-xs font-semibold uppercase tracking-[0.2em] text-jowi-gold sm:text-sm">
          {item.category} · {item.readTime}
        </p>
        <h2 className="mt-3 font-display text-2xl uppercase leading-tight text-white sm:mt-4 sm:text-3xl md:text-5xl">
          {item.headline}
        </h2>
        {item.summary ? (
          <p className="mt-3 text-base text-jowi-muted sm:mt-4 sm:text-lg">{item.summary}</p>
        ) : null}
        <p className="mt-5 text-lg leading-relaxed text-jowi-ink sm:mt-8 sm:text-xl md:text-2xl md:leading-relaxed">
          {item.body}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-10 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-jowi-gold px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-black sm:px-5 sm:py-3"
          >
            Back to desk
          </button>
          {item.attachmentPath && item.attachmentName && (
            <button
              type="button"
              onClick={onOpenAttachment}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2.5 text-sm text-jowi-gold hover:border-jowi-gold/50 sm:px-4 sm:py-3"
            >
              <FileText size={16} />
              Open document
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BulletinForm({
  initial,
  canWrite,
  onCancel,
  onSave,
}: {
  initial: NewsItem | null
  canWrite: boolean
  onCancel: () => void
  onSave: (input: NewsDraftInput) => Promise<{ ok: boolean; error?: string }>
}) {
  const [headline, setHeadline] = useState(initial?.headline ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [category, setCategory] = useState<NewsCategory>(initial?.category ?? 'Community')
  const [status, setStatus] = useState<NewsStatus>(initial?.status ?? 'live')
  const [file, setFile] = useState<File | null>(null)
  const [clearAttachment, setClearAttachment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractNote, setExtractNote] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)

  const existingName =
    !clearAttachment && !file ? initial?.attachmentName ?? null : null

  const applyExtractedText = (
    result: {
      text: string
      headline?: string
      summary?: string
      warning?: string
      engine?: string
    },
    hadBody: boolean,
  ) => {
    setBody(result.text)
    if (result.headline?.trim()) setHeadline(result.headline.trim().slice(0, 120))
    else if (!headline.trim()) {
      const firstLine = result.text.split(/\n/).map((l) => l.trim()).find(Boolean) ?? ''
      if (firstLine) setHeadline(firstLine.slice(0, 100))
    }
    if (result.summary?.trim()) setSummary(result.summary.trim().slice(0, 200))
    else if (!summary.trim()) {
      const firstLine = result.text.split(/\n/).map((l) => l.trim()).find(Boolean) ?? ''
      if (firstLine) setSummary(firstLine.slice(0, 160))
    }
    const engine =
      result.engine === 'gemini'
        ? 'AI extract (good for Luo + English photos).'
        : 'Local extract.'
    const base = hadBody
      ? 'Body replaced from the document. Edit before going live.'
      : 'Body filled from the document. Edit for a natural on-air read.'
    setExtractNote([base, engine, result.warning].filter(Boolean).join(' '))
  }

  const extractFromFile = async (next: File, currentBody: string) => {
    setExtracting(true)
    setExtractNote('Reading document for the booth…')
    setError(null)
    const result = await extractNewsAttachmentText(next)
    setExtracting(false)
    if (!result.ok) {
      setExtractNote(result.message)
      return
    }
    applyExtractedText(result, Boolean(currentBody.trim()))
  }

  const beginAttachment = (next: File) => {
    const check = isAllowedNewsAttachment(next)
    if (check) {
      setError(check)
      return
    }
    setError(null)
    setClearAttachment(false)
    setFile(next)
    if (next.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(next.name)) {
      setCropFile(next)
      return
    }
    void extractFromFile(next, body)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!headline.trim() || !body.trim()) {
      setError('Headline and body are required.')
      return
    }
    if (file) {
      const check = isAllowedNewsAttachment(file)
      if (check) {
        setError(check)
        return
      }
    }
    setBusy(true)
    setError(null)
    const result = await onSave({
      headline,
      summary: summary || headline,
      body,
      category,
      status,
      priority: category === 'Breaking' ? 10 : 0,
      file,
      clearAttachment: clearAttachment && !file,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error || 'Save failed — check Auth session, schema, and Storage bucket.')
    }
  }

  return (
    <>
      {cropFile && (
        <ImageCropDialog
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(cropped) => {
            setCropFile(null)
            setFile(cropped)
            void extractFromFile(cropped, body)
          }}
        />
      )}
    <form
      onSubmit={(e) => void submit(e)}
      className="mt-4 space-y-3 border border-white/10 bg-black/40 p-3 sm:mt-6 sm:space-y-4 sm:p-5"
    >
      <h3 className="font-display text-lg uppercase text-white">
        {initial ? 'Edit bulletin' : 'New bulletin'}
      </h3>
      {!canWrite && (
        <p className="text-sm text-jowi-muted">Connection required to save.</p>
      )}
      <label className="block text-xs uppercase tracking-wider text-jowi-muted">
        Headline
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
          required
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-jowi-muted">
        Summary
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-jowi-muted">
        Body (on-air read)
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
          required
        />
      </label>
      <p className="text-xs text-jowi-muted">
        Est. read: {estimateReadTime(body)}
        {extracting && <span className="ml-2 text-jowi-gold">Reading document…</span>}
      </p>
      {extractNote && <p className="text-xs text-jowi-gold">{extractNote}</p>}

      <div className="rounded-md border border-dashed border-white/20 px-4 py-3">
        <p className="text-xs uppercase tracking-wider text-jowi-muted">Attach document</p>
        <p className="mt-1 text-xs text-jowi-muted">
          Photos of notices or papers: crop to <strong className="font-medium text-jowi-ink">one
          story</strong>, then we AI-extract Luo/English for on-air reading. Also PDF / Word / text ·
          max 10 MB.
        </p>
        {(existingName || file) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white">
            <FileText size={14} className="text-jowi-gold" />
            <span className="truncate">{file?.name ?? existingName}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null)
                setClearAttachment(true)
                setExtractNote(null)
              }}
              className="text-xs text-jowi-muted underline hover:text-white"
            >
              Remove
            </button>
            {file && !extracting && (
              <button
                type="button"
                onClick={() => {
                  if (file.type.startsWith('image/')) setCropFile(file)
                  else void extractFromFile(file, body)
                }}
                className="text-xs font-semibold text-jowi-gold underline hover:text-white"
              >
                Re-extract
              </button>
            )}
          </div>
        )}
        <label className="mt-3 inline-block cursor-pointer text-sm font-semibold text-jowi-gold hover:underline">
          {existingName || file ? 'Replace file' : 'Choose file'}
          <input
            type="file"
            accept={NEWS_ATTACHMENT_ACCEPT}
            className="sr-only"
            disabled={extracting || busy}
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null
              e.target.value = ''
              if (!next) return
              beginAttachment(next)
            }}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="text-xs uppercase tracking-wider text-jowi-muted">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as NewsCategory)}
            className="mt-1.5 block rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-wider text-jowi-muted">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as NewsStatus)}
            className="mt-1.5 block rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="live">Live</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-jowi-gold px-4 py-2 text-sm font-bold uppercase tracking-wide text-black disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-white/20 px-4 py-2 text-sm text-jowi-muted hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
    </>
  )
}

function BoothInbox() {
  const { messages, highlightMessage, clearMessages } = useInteraction()
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [actionError, setActionError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (filter === 'all') return true
      if (filter === 'flagged') return Boolean(m.highlighted)
      return m.kind === (filter as MessageKind)
    })
  }, [messages, filter])

  const tabs: { id: InboxFilter; label: string }[] = [
    { id: 'all', label: `All (${messages.length})` },
    { id: 'flagged', label: `Flagged (${messages.filter((m) => m.highlighted).length})` },
    {
      id: 'request',
      label: `Requests (${messages.filter((m) => m.kind === 'request').length})`,
    },
    {
      id: 'shoutout',
      label: `Shoutouts (${messages.filter((m) => m.kind === 'shoutout').length})`,
    },
  ]

  const onClear = async () => {
    setActionError(null)
    setClearing(true)
    const result = await clearMessages()
    setClearing(false)
    if (!result.ok) setActionError(result.error ?? 'Clear failed')
  }

  const onFlag = async (id: string) => {
    setActionError(null)
    const result = await highlightMessage(id)
    if (!result.ok) setActionError(result.error ?? 'Flag failed')
  }

  return (
    <section className="mt-8 sm:mt-14">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl uppercase text-white sm:text-2xl">Interact inbox</h2>
          <p className="mt-0.5 text-xs text-jowi-muted sm:mt-1 sm:text-sm">
            Shoutouts and song requests from listeners.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            disabled={clearing}
            onClick={() => void onClear()}
            className="text-xs text-jowi-muted underline hover:text-white disabled:opacity-50 sm:text-sm"
          >
            {clearing ? 'Clearing…' : 'Clear all'}
          </button>
        )}
      </div>

      {actionError && (
        <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 sm:mt-3">
          {actionError}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:py-1.5 sm:text-xs ${
              filter === tab.id
                ? 'bg-jowi-gold text-black'
                : 'border border-white/15 text-jowi-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-jowi-muted sm:mt-6">
          {messages.length === 0
            ? 'Inbox is empty. Waiting for listeners…'
            : 'No messages in this filter.'}
        </p>
      ) : (
        <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
          {filtered.map((m) => (
            <li
              key={m.id}
              className={`border p-3 sm:p-4 ${
                m.highlighted
                  ? 'border-jowi-gold bg-jowi-gold/10'
                  : 'border-white/10 bg-black/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-wider text-jowi-muted sm:text-xs">
                  <span className={m.kind === 'request' ? 'text-jowi-accent' : 'text-jowi-gold'}>
                    {m.kind}
                  </span>
                  <span>·</span>
                  <span>{m.name}</span>
                  <span>·</span>
                  <time dateTime={m.createdAt}>
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </time>
                </div>
                <button
                  type="button"
                  onClick={() => void onFlag(m.id)}
                  className="text-[10px] font-semibold uppercase tracking-wide text-jowi-gold hover:underline sm:text-xs"
                >
                  {m.highlighted ? 'Unflag' : 'Flag for air'}
                </button>
              </div>
              {m.song && <p className="mt-1.5 font-medium text-white sm:mt-2">{m.song}</p>}
              <p className="mt-1 text-sm leading-snug text-jowi-ink">{m.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BoothPoll() {
  const {
    activePoll,
    votes,
    totalVotes,
    backendReady,
    publishPoll,
    endPoll,
    resetPollVotes,
  } = useInteraction()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setOptionAt = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  const addOption = () => {
    setOptions((prev) => (prev.length >= 6 ? prev : [...prev, '']))
  }

  const removeOption = (index: number) => {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)))
  }

  const onPublish = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNote(null)
    const result = await publishPoll({ question, options })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not publish poll')
      return
    }
    setQuestion('')
    setOptions(['', ''])
    setNote('Poll is live on Interact.')
  }

  const onReset = async () => {
    setBusy(true)
    setError(null)
    setNote(null)
    const result = await resetPollVotes()
    setBusy(false)
    if (!result.ok) setError(result.error ?? 'Could not reset votes')
    else setNote('Votes cleared — back to 0%.')
  }

  const onEnd = async () => {
    setBusy(true)
    setError(null)
    setNote(null)
    const result = await endPoll()
    setBusy(false)
    if (!result.ok) setError(result.error ?? 'Could not end poll')
    else setNote('Poll ended — hidden from listeners.')
  }

  return (
    <section className="mt-8 border-t border-white/10 pt-6 sm:mt-14 sm:pt-10">
      <h2 className="font-display text-xl uppercase text-white sm:text-2xl">Live poll</h2>
      <p className="mt-0.5 text-xs text-jowi-muted sm:mt-1 sm:text-sm">
        Publish a question to Interact. Listeners vote on the site; totals update here.
      </p>

      {!backendReady ? (
        <p className="mt-3 text-sm text-jowi-muted sm:mt-4">Poll tools unavailable offline.</p>
      ) : (
        <>
          <div className="mt-4 border border-white/10 bg-black/30 p-3 sm:mt-6 sm:p-5">
            {activePoll ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-jowi-gold sm:text-xs">
                  On air now
                </p>
                <p className="mt-1.5 font-medium text-white sm:mt-2">{activePoll.question}</p>
                <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                  {activePoll.options.map((opt) => {
                    const count = votes[opt.id] ?? 0
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                    return (
                      <li key={opt.id}>
                        <div className="flex justify-between gap-2 text-sm text-white">
                          <span className="min-w-0 truncate">{opt.label}</span>
                          <span className="shrink-0 tabular-nums text-jowi-muted">
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/10 sm:h-2">
                          <div className="h-full bg-jowi-gold" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2.5 text-xs text-jowi-muted sm:mt-3">{totalVotes} total votes</p>
                <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onReset()}
                    className="rounded-md border border-white/20 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-jowi-muted hover:text-white disabled:opacity-50 sm:px-3 sm:py-2 sm:text-xs"
                  >
                    Reset votes
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onEnd()}
                    className="rounded-md border border-white/20 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-jowi-muted hover:text-white disabled:opacity-50 sm:px-3 sm:py-2 sm:text-xs"
                  >
                    End poll
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-jowi-muted">No live poll. Publish one below.</p>
            )}
          </div>

          <form
            onSubmit={onPublish}
            className="mt-4 border border-white/10 bg-jowi-card/40 p-3 sm:mt-6 sm:p-5"
          >
            <h3 className="font-display text-base uppercase text-white sm:text-lg">New poll</h3>
            <p className="mt-0.5 text-xs text-jowi-muted sm:mt-1 sm:text-sm">
              Publishing replaces any current live poll. 2–6 options.
            </p>
            <label className="mt-3 block text-xs uppercase tracking-wider text-jowi-muted sm:mt-4">
              Question
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
                placeholder="What should we play next?"
              />
            </label>
            <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
              {options.map((opt, index) => (
                <label key={index} className="block text-xs uppercase tracking-wider text-jowi-muted">
                  Option {index + 1}
                  <div className="mt-1.5 flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => setOptionAt(index, e.target.value)}
                      required
                      className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
                      placeholder={`Choice ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="shrink-0 px-2 text-xs text-jowi-muted hover:text-white"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-jowi-gold hover:underline sm:mt-3"
              >
                Add option
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-md bg-jowi-gold px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark disabled:opacity-50 sm:mt-5 sm:w-auto"
            >
              {busy ? 'Publishing…' : 'Publish to Interact'}
            </button>
          </form>

          {error && (
            <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 sm:mt-4">
              {error}
            </p>
          )}
          {note && !error && (
            <p className="mt-3 text-sm text-jowi-gold sm:mt-4">{note}</p>
          )}
        </>
      )}
    </section>
  )
}

/** Guard helper if needed by router loaders later */
export function RequirePresenter({ children }: { children: ReactNode }) {
  const { isPresenter } = usePresenterAuth()
  if (!isPresenter) return <Navigate to="/booth" replace />
  return children
}
