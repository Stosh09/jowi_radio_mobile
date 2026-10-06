import { Archive, Check, Eye, Paperclip, Pencil, Plus, Radio, Undo2 } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import type { NewsItem } from '@shared/news'
import { useNews } from '../../context/NewsContext'
import { haptic } from '../../lib/haptics'
import { KEYS, readJson, writeJson } from '../../lib/storage'
import { colors, radius, space } from '../../theme'
import { timeAgo } from '../MessageItem'
import { Button, Card, Notice, Pill, Segmented, Txt } from '../ui'
import { BulletinForm } from './BulletinForm'
import { FocusReader } from './FocusReader'

function hourBucket(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`
}

interface UsedStore {
  bucket: string
  ids: string[]
}

/** Which bulletins were read this clock hour — resets automatically on the hour. */
function useUsedThisHour() {
  const [store, setStore] = useState<UsedStore>({ bucket: hourBucket(), ids: [] })

  useEffect(() => {
    void readJson<UsedStore | null>(KEYS.newsUsed, null).then((saved) => {
      if (saved && saved.bucket === hourBucket()) setStore(saved)
    })
    const id = setInterval(() => {
      setStore((prev) => (prev.bucket === hourBucket() ? prev : { bucket: hourBucket(), ids: [] }))
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const isUsed = useCallback((id: string) => store.bucket === hourBucket() && store.ids.includes(id), [store])

  const toggle = useCallback((id: string) => {
    setStore((prev) => {
      const bucket = hourBucket()
      const ids = prev.bucket === bucket ? prev.ids : []
      const next = { bucket, ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] }
      void writeJson(KEYS.newsUsed, next)
      return next
    })
  }, [])

  return { isUsed, toggle }
}

function NewsCard({
  item,
  used,
  onToggleUsed,
  onFocus,
  onEdit,
}: {
  item: NewsItem
  used: boolean
  onToggleUsed: () => void
  onFocus: () => void
  onEdit: () => void
}) {
  const { setStatus, openAttachment } = useNews()
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const isDraft = item.status === 'draft'

  const run = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(key)
    const res = await fn()
    setBusy(null)
    if (res.ok) haptic.success()
    else Alert.alert('Could not update bulletin', res.error ?? 'Try again.')
  }

  const archive = () =>
    Alert.alert('Archive bulletin?', `"${item.headline}" will leave the news board.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => void run('archive', () => setStatus(item.id, 'archived')) },
    ])

  return (
    <Card tone={item.category === 'Breaking' ? 'live' : 'default'} style={[used && { opacity: 0.6 }]}>
      <View style={styles.pills}>
        <Pill label={item.category} tone={item.category === 'Breaking' ? 'live' : 'gold'} />
        {isDraft ? <Pill label="Draft" tone="muted" /> : null}
        {used ? <Pill label="Used this hour" tone="accent" /> : null}
        <Txt variant="small" style={{ marginLeft: 'auto' }}>
          {item.readTime}
          {item.updatedAt ? ` · ${timeAgo(item.updatedAt)}` : ''}
        </Txt>
      </View>
      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" accessibilityHint="Show full bulletin">
        <Txt variant="heading" style={{ marginTop: space.sm, textTransform: 'none' }}>
          {item.headline}
        </Txt>
        {item.summary ? (
          <Txt variant="muted" style={{ marginTop: 4 }}>
            {item.summary}
          </Txt>
        ) : null}
        {item.body ? (
          <Txt style={{ marginTop: space.sm }} numberOfLines={expanded ? undefined : 3}>
            {item.body}
          </Txt>
        ) : null}
      </Pressable>
      {item.attachmentPath ? (
        <Pressable
          onPress={async () => {
            const ok = await openAttachment(item)
            if (!ok) Alert.alert('Attachment unavailable', 'Sign in with the booth Auth user to open files.')
          }}
          style={styles.attachment}
        >
          <Paperclip size={14} color={colors.gold} />
          <Txt variant="small" style={{ color: colors.gold, flex: 1 }} numberOfLines={1}>
            {item.attachmentName ?? 'Attachment'}
          </Txt>
        </Pressable>
      ) : null}
      <View style={styles.actions}>
        <Button
          compact
          label={used ? 'Unmark' : 'Mark used'}
          icon={used ? Undo2 : Check}
          variant={used ? 'outline' : 'primary'}
          onPress={onToggleUsed}
        />
        <Button compact label="Focus read" icon={Eye} variant="outline" onPress={onFocus} />
        <Button compact label="Edit" icon={Pencil} variant="ghost" onPress={onEdit} />
        {isDraft ? (
          <Button
            compact
            label="Go live"
            icon={Radio}
            variant="outline"
            loading={busy === 'live'}
            onPress={() => void run('live', () => setStatus(item.id, 'live'))}
          />
        ) : null}
        <Button compact label="Archive" icon={Archive} variant="danger" loading={busy === 'archive'} onPress={archive} />
      </View>
    </Card>
  )
}

export function NewsBoard() {
  const { live, drafts, backendReady, usingFallback, cachedAt } = useNews()
  const { isUsed, toggle } = useUsedThisHour()
  const [view, setView] = useState<'live' | 'drafts'>('live')
  const [focus, setFocus] = useState<NewsItem | null>(null)
  const [editing, setEditing] = useState<NewsItem | 'new' | null>(null)
  const list = view === 'live' ? live : drafts
  const unusedCount = live.filter((n) => !isUsed(n.id)).length

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Txt variant="eyebrow">News for air</Txt>
          <Txt variant="small" style={{ marginTop: 2 }}>
            {live.length ? `${unusedCount} of ${live.length} not yet read this hour` : 'Nothing live right now'}
          </Txt>
        </View>
        <Button compact label="Add" icon={Plus} onPress={() => setEditing('new')} disabled={!backendReady} />
      </View>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'live', label: 'Live', badge: live.length ? String(live.length) : undefined },
          { value: 'drafts', label: 'Drafts', badge: drafts.length ? String(drafts.length) : undefined },
        ]}
      />

      {!backendReady ? <Notice tone="warn">Connect Supabase in mobile/.env to manage news from the phone.</Notice> : null}
      {usingFallback && backendReady ? (
        <Notice tone="warn">Could not load bulletins from the studio server. Pull down to retry.</Notice>
      ) : null}
      {cachedAt ? <Notice tone="info">Offline — showing bulletins saved {timeAgo(cachedAt)}.</Notice> : null}

      {list.length === 0 ? (
        <Card tone="flat">
          <Txt variant="muted" style={{ textAlign: 'center' }}>
            {view === 'live' ? 'No live bulletins. Add one or publish a draft.' : 'No drafts waiting.'}
          </Txt>
        </Card>
      ) : (
        list.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            used={isUsed(item.id)}
            onToggleUsed={() => {
              haptic.press()
              toggle(item.id)
            }}
            onFocus={() => setFocus(item)}
            onEdit={() => setEditing(item)}
          />
        ))
      )}

      <FocusReader
        item={focus}
        used={focus ? isUsed(focus.id) : false}
        onToggleUsed={() => focus && toggle(focus.id)}
        onClose={() => setFocus(null)}
      />
      <BulletinForm
        visible={editing != null}
        item={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pills: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: space.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.goldSoft,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
})
