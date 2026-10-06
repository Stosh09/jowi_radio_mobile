import { Flag, Music2, Trash2 } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useInteraction, type InteractionMessage } from '../../context/InteractionContext'
import { haptic } from '../../lib/haptics'
import { colors, space } from '../../theme'
import { timeAgo } from '../MessageItem'
import { Button, Card, Notice, Pill, Segmented, Txt } from '../ui'

type Filter = 'all' | 'flagged' | 'request' | 'shoutout'

function InboxRow({ message, onError }: { message: InteractionMessage; onError: (msg: string) => void }) {
  const { highlightMessage, deleteMessage } = useInteraction()
  const [busy, setBusy] = useState<'flag' | 'delete' | null>(null)

  const flag = async () => {
    setBusy('flag')
    const res = await highlightMessage(message.id)
    setBusy(null)
    if (res.ok) haptic.press()
    else onError(res.error ?? 'Could not update message.')
  }

  const remove = async () => {
    setBusy('delete')
    const res = await deleteMessage(message.id)
    setBusy(null)
    if (!res.ok) onError(res.error ?? 'Could not remove message.')
  }

  return (
    <Card tone={message.highlighted ? 'gold' : 'default'} style={{ padding: space.md }}>
      <View style={styles.meta}>
        <Pill label={message.kind === 'request' ? 'Request' : 'Shout-out'} tone={message.kind === 'request' ? 'accent' : 'muted'} />
        {message.highlighted ? <Pill label="For air" /> : null}
        <Txt variant="small" style={{ marginLeft: 'auto' }}>
          {timeAgo(message.createdAt)}
        </Txt>
      </View>
      <Txt style={{ marginTop: space.sm, color: colors.white, fontSize: 17 }}>{message.name}</Txt>
      {message.song ? (
        <View style={styles.song}>
          <Music2 size={14} color={colors.gold} />
          <Txt style={{ color: colors.gold, flex: 1 }}>{message.song}</Txt>
        </View>
      ) : null}
      {message.text ? <Txt style={{ marginTop: 4 }}>{message.text}</Txt> : null}
      <View style={styles.actions}>
        <Button
          compact
          label={message.highlighted ? 'Unflag' : 'Flag for air'}
          icon={Flag}
          variant={message.highlighted ? 'outline' : 'primary'}
          loading={busy === 'flag'}
          onPress={() => void flag()}
        />
        <Button compact label="Remove" icon={Trash2} variant="danger" loading={busy === 'delete'} onPress={() => void remove()} />
      </View>
    </Card>
  )
}

export function BoothInbox() {
  const { messages, clearMessages, backendReady } = useInteraction()
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const inbox = useMemo(() => messages.filter((m) => !m.pending), [messages])
  const counts = useMemo(
    () => ({
      all: inbox.length,
      flagged: inbox.filter((m) => m.highlighted).length,
      request: inbox.filter((m) => m.kind === 'request').length,
      shoutout: inbox.filter((m) => m.kind === 'shoutout').length,
    }),
    [inbox],
  )
  const list = useMemo(() => {
    if (filter === 'flagged') return inbox.filter((m) => m.highlighted)
    if (filter === 'all') return inbox
    return inbox.filter((m) => m.kind === filter)
  }, [inbox, filter])

  const clearAll = () =>
    Alert.alert('Clear the inbox?', `This removes all ${inbox.length} listener messages for everyone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          setClearing(true)
          const res = await clearMessages()
          setClearing(false)
          if (res.ok) haptic.success()
          else setError(res.error ?? 'Could not clear inbox.')
        },
      },
    ])

  const badge = (n: number) => (n ? String(n) : undefined)

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Txt variant="eyebrow">Listener inbox</Txt>
          <Txt variant="small" style={{ marginTop: 2 }}>
            Shout-outs and requests arrive live.
          </Txt>
        </View>
        {inbox.length ? (
          <Button compact label="Clear all" icon={Trash2} variant="danger" loading={clearing} onPress={clearAll} />
        ) : null}
      </View>
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All', badge: badge(counts.all) },
          { value: 'flagged', label: 'For air', badge: badge(counts.flagged) },
          { value: 'request', label: 'Requests', badge: badge(counts.request) },
          { value: 'shoutout', label: 'Shout-outs', badge: badge(counts.shoutout) },
        ]}
      />
      {!backendReady ? <Notice tone="warn">Connect Supabase to receive live listener messages.</Notice> : null}
      {error ? (
        <Notice tone="error" action={<Button compact label="Dismiss" variant="ghost" onPress={() => setError(null)} />}>
          {error}
        </Notice>
      ) : null}
      {list.length === 0 ? (
        <Card tone="flat">
          <Txt variant="muted" style={{ textAlign: 'center' }}>
            {filter === 'flagged' ? 'Nothing flagged for air yet.' : 'Inbox is empty.'}
          </Txt>
        </Card>
      ) : (
        list.map((m) => <InboxRow key={m.id} message={m} onError={setError} />)
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  song: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
})
