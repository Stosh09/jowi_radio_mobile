import { Plus, RotateCcw, Send, Square, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useInteraction, type ActionResult } from '../../context/InteractionContext'
import { haptic } from '../../lib/haptics'
import { colors, fonts, radius, space } from '../../theme'
import { Button, Card, Field, IconButton, Notice, Txt } from '../ui'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

function PollResults() {
  const { activePoll, votes, totalVotes, endPoll, resetPollVotes } = useInteraction()
  const [busy, setBusy] = useState<'reset' | 'end' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!activePoll) {
    return (
      <Card tone="flat">
        <Txt variant="muted" style={{ textAlign: 'center' }}>
          No live poll. Start one below.
        </Txt>
      </Card>
    )
  }

  const run = (key: 'reset' | 'end', title: string, message: string, fn: () => Promise<ActionResult>) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: key === 'end' ? 'End poll' : 'Reset',
        style: 'destructive',
        onPress: async () => {
          setBusy(key)
          setError(null)
          const res = await fn()
          setBusy(null)
          if (res.ok) haptic.success()
          else setError(res.error ?? 'Action failed.')
        },
      },
    ])

  return (
    <Card tone="gold">
      <Txt variant="eyebrow">Live poll</Txt>
      <Txt variant="heading" style={{ marginTop: 6, textTransform: 'none' }}>
        {activePoll.question}
      </Txt>
      <View style={{ gap: space.md, marginTop: space.md }}>
        {activePoll.options.map((opt) => {
          const count = votes[opt.id] ?? 0
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0
          return (
            <View key={opt.id}>
              <View style={styles.optionRow}>
                <Txt style={{ flex: 1, color: colors.white }}>{opt.label}</Txt>
                <Txt style={styles.count}>
                  {count} · {pct}%
                </Txt>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%` }]} />
              </View>
            </View>
          )
        })}
      </View>
      <Txt variant="small" style={{ marginTop: space.md }}>
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} so far
      </Txt>
      {error ? (
        <View style={{ marginTop: space.md }}>
          <Notice tone="error">{error}</Notice>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button
          compact
          label="Reset votes"
          icon={RotateCcw}
          variant="outline"
          loading={busy === 'reset'}
          onPress={() => run('reset', 'Reset votes?', 'All votes on this poll will be cleared.', resetPollVotes)}
        />
        <Button
          compact
          label="End poll"
          icon={Square}
          variant="danger"
          loading={busy === 'end'}
          onPress={() => run('end', 'End this poll?', 'Listeners will no longer see it.', endPoll)}
        />
      </View>
    </Card>
  )
}

function NewPollForm() {
  const { publishPoll, activePoll } = useInteraction()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  const setOption = (i: number, value: string) => setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))

  const publish = async () => {
    setBusy(true)
    setNote(null)
    const res = await publishPoll({ question, options })
    setBusy(false)
    if (res.ok) {
      haptic.success()
      setQuestion('')
      setOptions(['', ''])
      setNote({ tone: 'success', text: 'Poll is live for listeners.' })
    } else {
      haptic.warn()
      setNote({ tone: 'error', text: res.error ?? 'Could not publish poll.' })
    }
  }

  const confirmPublish = () => {
    if (!activePoll) return void publish()
    Alert.alert('Replace live poll?', 'Publishing ends the current poll.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Replace', onPress: () => void publish() },
    ])
  }

  return (
    <Card>
      <Txt variant="eyebrow">New poll</Txt>
      <Field label="Question" value={question} onChangeText={setQuestion} placeholder="Who wins the derby?" maxLength={140} />
      {options.map((opt, i) => (
        <View key={i} style={styles.optionInput}>
          <View style={{ flex: 1 }}>
            <Field
              label={`Option ${i + 1}`}
              value={opt}
              onChangeText={(v) => setOption(i, v)}
              placeholder={i === 0 ? 'Gor Mahia' : i === 1 ? 'AFC Leopards' : 'Another option'}
              maxLength={80}
            />
          </View>
          {options.length > MIN_OPTIONS ? (
            <IconButton
              icon={X}
              label={`Remove option ${i + 1}`}
              onPress={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
              style={{ marginTop: space.md + 22 }}
            />
          ) : null}
        </View>
      ))}
      {options.length < MAX_OPTIONS ? (
        <Button
          compact
          label="Add option"
          icon={Plus}
          variant="ghost"
          onPress={() => setOptions((prev) => [...prev, ''])}
          style={{ alignSelf: 'flex-start', marginTop: space.sm }}
        />
      ) : null}
      {note ? (
        <View style={{ marginTop: space.md }}>
          <Notice tone={note.tone}>{note.text}</Notice>
        </View>
      ) : null}
      <Button label="Publish poll" icon={Send} onPress={confirmPublish} loading={busy} block style={{ marginTop: space.lg }} />
    </Card>
  )
}

export function BoothPoll() {
  return (
    <View style={{ gap: space.md }}>
      <PollResults />
      <NewPollForm />
    </View>
  )
}

const styles = StyleSheet.create({
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  count: { fontFamily: fonts.bodySemi, color: colors.gold, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.gold },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
  optionInput: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
})
