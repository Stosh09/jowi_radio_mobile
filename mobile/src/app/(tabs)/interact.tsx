import { Megaphone, Music2, Send } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { ContactActions } from '../../components/ContactActions'
import { MessageItem, timeAgo } from '../../components/MessageItem'
import { PollCard } from '../../components/PollCard'
import { Button, Card, Field, Notice, Screen, Segmented, Txt } from '../../components/ui'
import { useInteraction } from '../../context/InteractionContext'
import { usePreferences } from '../../context/PreferencesContext'
import { haptic } from '../../lib/haptics'
import { space } from '../../theme'

type Mode = 'shoutout' | 'request'

export default function InteractScreen() {
  const { backendReady, messages, refresh, cachedAt, outboxCount } = useInteraction()
  const [refreshing, setRefreshing] = useState(false)
  const recent = messages.slice(0, 10)
  const mineCount = messages.filter((m) => m.mine && m.highlighted).length

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }, [refresh])

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen onRefresh={onRefresh} refreshing={refreshing}>
        <Txt variant="eyebrow">Studio line</Txt>
        <Txt variant="display" style={{ marginTop: 6 }}>
          Interact
        </Txt>
        <Txt variant="muted" style={{ marginTop: 6 }}>
          Shout out a friend, request a song, or vote in the live poll. Presenters pick messages up from the booth desk.
        </Txt>

        {!backendReady ? (
          <View style={{ marginTop: space.md }}>
            <Notice tone="warn">The studio connection is not set up yet. Messages will be available soon.</Notice>
          </View>
        ) : null}
        {mineCount > 0 ? (
          <View style={{ marginTop: space.md }}>
            <Notice tone="success">
              The booth picked {mineCount === 1 ? 'your message' : `${mineCount} of your messages`} for air. Stay tuned!
            </Notice>
          </View>
        ) : null}

        <Composer />

        <View style={{ marginTop: space.xl }}>
          <PollCard />
        </View>

        <View style={{ marginTop: space.xl }}>
          <Txt variant="title">Recent from listeners</Txt>
          {cachedAt ? (
            <Txt variant="small" style={{ marginTop: 4 }}>
              Saved {timeAgo(cachedAt)} — pull down to refresh
            </Txt>
          ) : null}
          {outboxCount > 0 ? (
            <Txt variant="small" style={{ marginTop: 4 }}>
              {outboxCount} message{outboxCount === 1 ? '' : 's'} waiting to send
            </Txt>
          ) : null}
          {recent.length === 0 ? (
            <Txt variant="muted" style={{ marginTop: 8 }}>
              No messages yet — be the first to shout out the booth.
            </Txt>
          ) : (
            recent.map((m) => <MessageItem key={m.id} message={m} />)
          )}
        </View>

        <View style={{ marginTop: space.xl }}>
          <Txt variant="title">Call the studio</Txt>
          <Txt variant="muted" style={{ marginTop: 4, marginBottom: 12 }}>
            Prefer to talk? Reach the booth directly.
          </Txt>
          <ContactActions />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

function Composer() {
  const { sendShoutout, sendRequest, backendReady } = useInteraction()
  const { settings, updateSettings } = usePreferences()
  const [mode, setMode] = useState<Mode>('shoutout')
  const [nameDraft, setName] = useState<string | null>(null)
  const name = nameDraft ?? settings.listenerName
  const [text, setText] = useState('')
  const [song, setSong] = useState('')
  const [dedication, setDedication] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ tone: 'success' | 'warn' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!note) return
    const id = setTimeout(() => setNote(null), 4000)
    return () => clearTimeout(id)
  }, [note])

  const submit = async () => {
    const valid = mode === 'shoutout' ? text.trim() : song.trim()
    if (!valid) {
      haptic.warn()
      setNote({ tone: 'warn', text: mode === 'shoutout' ? 'Write a message first.' : 'Add the song or artist.' })
      return
    }
    setBusy(true)
    if (name.trim() !== settings.listenerName) updateSettings({ listenerName: name.trim() })
    const res = mode === 'shoutout' ? await sendShoutout(name, text) : await sendRequest(name, song, dedication)
    setBusy(false)
    if (!res.ok) {
      haptic.warn()
      setNote({ tone: 'error', text: res.error ?? 'Could not send. Try again.' })
      return
    }
    haptic.success()
    setText('')
    setSong('')
    setDedication('')
    setNote(
      res.queued
        ? { tone: 'warn', text: 'No signal — saved. It sends automatically when you are back online.' }
        : { tone: 'success', text: mode === 'shoutout' ? 'Sent to the booth!' : 'Request sent!' },
    )
  }

  return (
    <Card style={{ marginTop: space.lg }}>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'shoutout', label: 'Shoutout' },
          { value: 'request', label: 'Song request' },
        ]}
      />
      <Txt variant="muted" style={{ marginTop: 10 }}>
        {mode === 'shoutout' ? 'Send a message the DJ can read on air.' : 'Ask the booth to spin your track.'}
      </Txt>

      <Field label="Your name" value={name} onChangeText={setName} placeholder="Optional" autoComplete="name" maxLength={60} />
      {mode === 'shoutout' ? (
        <Field
          label="Message"
          value={text}
          onChangeText={setText}
          placeholder="Big up the Morning Show from…"
          multiline
          maxLength={500}
        />
      ) : (
        <>
          <Field label="Song / artist" value={song} onChangeText={setSong} placeholder="Artist — Title" maxLength={120} />
          <Field
            label="Dedication (optional)"
            value={dedication}
            onChangeText={setDedication}
            placeholder="For Mum in town…"
            maxLength={300}
          />
        </>
      )}

      {note ? (
        <View style={{ marginTop: space.md }}>
          <Notice tone={note.tone}>{note.text}</Notice>
        </View>
      ) : null}

      <Button
        label={mode === 'shoutout' ? 'Send shoutout' : 'Send request'}
        icon={mode === 'shoutout' ? Megaphone : Music2}
        loading={busy}
        disabled={!backendReady}
        style={{ marginTop: space.lg }}
        onPress={() => void submit()}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <Send size={12} color="#9aa3ad" />
        <Txt variant="small">Works on weak signal — we queue and resend for you.</Txt>
      </View>
    </Card>
  )
}
