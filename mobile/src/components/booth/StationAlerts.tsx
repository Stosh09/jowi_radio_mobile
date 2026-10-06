import { BellRing, Send } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Alert, View } from 'react-native'
import { usePresenterAuth } from '../../context/PresenterAuthContext'
import { anonHeaders, PUSH_URL } from '../../lib/env'
import { haptic } from '../../lib/haptics'
import { supabase } from '../../lib/supabase'
import { colors, space } from '../../theme'
import { timeAgo } from '../MessageItem'
import { Button, Card, Divider, Field, Notice, Segmented, Txt } from '../ui'

type Target = '/' | '/interact' | '/schedule'

const TARGETS: { value: Target; label: string }[] = [
  { value: '/', label: 'Listen' },
  { value: '/interact', label: 'Interact' },
  { value: '/schedule', label: 'Schedule' },
]

const PRESETS: { title: string; body: string; url: Target }[] = [
  { title: 'Breaking news on JOWI', body: 'Tune in now for the latest bulletin on 98.1 FM.', url: '/' },
  { title: 'Lines are open', body: 'Send your shout-outs and song requests to the studio now.', url: '/interact' },
  { title: 'Poll is live', body: 'Have your say — vote in the live JOWI poll.', url: '/interact' },
]

interface Broadcast {
  id: string
  title: string
  body: string
  sent_count: number
  created_at: string
}

export function StationAlerts() {
  const { hasAuthSession, accessToken, boothEmail } = usePresenterAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState<Target>('/')
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState<{ tone: 'error' | 'success' | 'warn'; text: string } | null>(null)
  const [history, setHistory] = useState<Broadcast[]>([])

  const fetchHistory = useCallback(async (): Promise<Broadcast[] | null> => {
    if (!supabase || !hasAuthSession) return null
    const { data } = await supabase
      .from('push_broadcasts')
      .select('id, title, body, sent_count, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    return (data as Broadcast[] | null) ?? null
  }, [hasAuthSession])

  const loadHistory = useCallback(() => {
    void fetchHistory().then((rows) => {
      if (rows) setHistory(rows)
    })
  }, [fetchHistory])

  useEffect(loadHistory, [loadHistory])

  const send = async () => {
    if (!PUSH_URL || !accessToken) return
    setSending(true)
    setNote(null)
    try {
      const res = await fetch(PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...anonHeaders(), Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url }),
      })
      const json = (await res.json().catch(() => ({}))) as { sent?: number; error?: string; message?: string }
      if (!res.ok) {
        haptic.warn()
        setNote({
          tone: 'error',
          text:
            res.status === 404
              ? 'The send-push function is not deployed yet (see mobile/README.md).'
              : res.status === 401
                ? 'Your booth session expired. Sign out and sign in again.'
                : (json.message ?? json.error ?? `Send failed (${res.status}).`),
        })
        return
      }
      haptic.success()
      setNote({
        tone: json.sent ? 'success' : 'warn',
        text: json.sent
          ? `Alert sent to ${json.sent} ${json.sent === 1 ? 'phone' : 'phones'}.`
          : 'No listeners have station alerts switched on yet.',
      })
      setTitle('')
      setBody('')
      loadHistory()
    } catch {
      haptic.warn()
      setNote({ tone: 'error', text: 'Could not reach the studio server. Check the connection.' })
    } finally {
      setSending(false)
    }
  }

  const confirmSend = () => {
    if (!title.trim() || !body.trim()) {
      setNote({ tone: 'error', text: 'Add a title and a message.' })
      return
    }
    Alert.alert('Send to all listeners?', `"${title.trim()}" will pop up on every phone with alerts on.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: () => void send() },
    ])
  }

  if (!hasAuthSession) {
    return (
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BellRing size={20} color={colors.gold} />
          <Txt variant="heading">Station alerts</Txt>
        </View>
        <View style={{ marginTop: space.md }}>
          <Notice tone="warn">
            {`Push alerts need the confirmed booth Auth user (${boothEmail}). Signed in with PIN only — confirm that user in Supabase Auth, then sign in again.`}
          </Notice>
        </View>
      </Card>
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BellRing size={20} color={colors.gold} />
          <Txt variant="heading">Station alert</Txt>
        </View>
        <Txt variant="small" style={{ marginTop: 6 }}>
          Sends a push notification to every listener who switched on station alerts.
        </Txt>

        <Txt variant="eyebrow" style={{ marginTop: space.lg, marginBottom: space.sm }}>
          Quick start
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map((p) => (
            <Button
              key={p.title}
              compact
              label={p.title}
              variant="outline"
              onPress={() => {
                setTitle(p.title)
                setBody(p.body)
                setUrl(p.url)
              }}
            />
          ))}
        </View>

        <Field label="Title" value={title} onChangeText={setTitle} maxLength={65} placeholder="Short and punchy" />
        <Field
          label="Message"
          value={body}
          onChangeText={setBody}
          maxLength={178}
          multiline
          placeholder="What listeners see in the notification"
          hint={`${body.length}/178`}
        />
        <Txt variant="eyebrow" style={{ marginTop: space.lg, marginBottom: space.sm }}>
          Opens
        </Txt>
        <Segmented value={url} onChange={setUrl} options={TARGETS} />

        {!PUSH_URL ? (
          <View style={{ marginTop: space.md }}>
            <Notice tone="warn">Connect Supabase in mobile/.env to send alerts.</Notice>
          </View>
        ) : null}
        {note ? (
          <View style={{ marginTop: space.md }}>
            <Notice tone={note.tone}>{note.text}</Notice>
          </View>
        ) : null}
        <Button
          label="Send alert"
          icon={Send}
          onPress={confirmSend}
          loading={sending}
          disabled={!PUSH_URL}
          block
          style={{ marginTop: space.lg }}
        />
      </Card>

      {history.length ? (
        <Card tone="flat">
          <Txt variant="eyebrow">Recent alerts</Txt>
          {history.map((b, i) => (
            <View key={b.id}>
              {i > 0 ? <Divider style={{ marginVertical: space.sm }} /> : null}
              <View style={{ marginTop: i === 0 ? space.sm : 0 }}>
                <Txt style={{ color: colors.white }}>{b.title}</Txt>
                <Txt variant="small">{b.body}</Txt>
                <Txt variant="small" style={{ marginTop: 2 }}>
                  {timeAgo(b.created_at)} · {b.sent_count} {b.sent_count === 1 ? 'phone' : 'phones'}
                </Txt>
              </View>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  )
}
