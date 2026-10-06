import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { FALLBACK_POLL } from '@shared/station'
import { useNetwork } from '../hooks/useNetwork'
import { randomId } from '../lib/id'
import { KEYS, readCache, readJson, writeCache, writeJson } from '../lib/storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type MessageKind = 'shoutout' | 'request'

export interface InteractionMessage {
  id: string
  kind: MessageKind
  name: string
  text: string
  song?: string
  createdAt: string
  highlighted?: boolean
  /** Sent from this phone */
  mine?: boolean
  /** Waiting in the offline outbox */
  pending?: boolean
}

export interface PollOption {
  id: string
  label: string
}

export interface LivePoll {
  id: string
  question: string
  options: PollOption[]
  active: boolean
}

export type PollVotes = Record<string, number>
export type ActionResult = { ok: boolean; error?: string; queued?: boolean }

export interface PublishPollInput {
  question: string
  options: string[]
}

interface OutboxItem {
  localId: string
  kind: MessageKind
  name: string
  body: string
  song?: string
  createdAt: string
}

interface InteractionApi {
  messages: InteractionMessage[]
  activePoll: LivePoll | null
  votes: PollVotes
  myVote: string | null
  totalVotes: number
  backendReady: boolean
  cachedAt: string | null
  outboxCount: number
  refresh: () => Promise<void>
  sendShoutout: (name: string, text: string) => Promise<ActionResult>
  sendRequest: (name: string, song: string, dedication?: string) => Promise<ActionResult>
  vote: (optionId: string) => Promise<ActionResult>
  highlightMessage: (id: string) => Promise<ActionResult>
  deleteMessage: (id: string) => Promise<ActionResult>
  clearMessages: () => Promise<ActionResult>
  publishPoll: (input: PublishPollInput) => Promise<ActionResult>
  endPoll: () => Promise<ActionResult>
  resetPollVotes: () => Promise<ActionResult>
}

interface MessageRow {
  id: string
  kind: MessageKind
  name: string
  body: string
  song: string | null
  highlighted: boolean
  created_at: string
}

const InteractionContext = createContext<InteractionApi | null>(null)
const MINE_KEY = 'jowi-my-messages'
const OUTBOX_KEY = 'jowi-outbox'

function fallbackPoll(): LivePoll {
  return {
    id: FALLBACK_POLL.id,
    question: FALLBACK_POLL.question,
    active: true,
    options: FALLBACK_POLL.options.map((o) => ({ id: o.id, label: o.label })),
  }
}

function emptyVotesFor(poll: LivePoll | null): PollVotes {
  if (!poll) return {}
  return Object.fromEntries(poll.options.map((o) => [o.id, 0]))
}

function mapMessage(row: MessageRow): InteractionMessage {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    text: row.body,
    song: row.song ?? undefined,
    createdAt: row.created_at,
    highlighted: row.highlighted,
  }
}

function slugOptionId(pollId: string, index: number, label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
  return `${pollId}-${index}-${slug || 'opt'}`
}

const notConfigured: ActionResult = { ok: false, error: 'The studio connection is not set up yet.' }

export function InteractionProvider({ children }: { children: ReactNode }) {
  const { isOffline } = useNetwork()
  const [messages, setMessages] = useState<InteractionMessage[]>([])
  const [activePoll, setActivePoll] = useState<LivePoll | null>(() => (supabase ? null : fallbackPoll()))
  const [votes, setVotes] = useState<PollVotes>({})
  const [myVote, setMyVote] = useState<string | null>(null)
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const [mine, setMine] = useState<string[]>([])
  const [outbox, setOutbox] = useState<OutboxItem[]>([])
  const voterKeyRef = useRef<string | null>(null)
  const backendReady = isSupabaseConfigured && Boolean(supabase)

  const getVoterKey = useCallback(async () => {
    if (voterKeyRef.current) return voterKeyRef.current
    const existing = await readJson<string | null>(KEYS.voterKey, null)
    const key = existing ?? `v-${randomId()}`
    if (!existing) await writeJson(KEYS.voterKey, key)
    voterKeyRef.current = key
    return key
  }, [])

  // Restore cached feed, poll, own-message ids and outbox for instant / offline start.
  useEffect(() => {
    void (async () => {
      const [cachedMessages, cachedPoll, mineIds, queued] = await Promise.all([
        readCache<InteractionMessage[]>(KEYS.cacheMessages),
        readCache<{ poll: LivePoll | null; votes: PollVotes; myVote: string | null }>(KEYS.cachePoll),
        readJson<string[]>(MINE_KEY, []),
        readJson<OutboxItem[]>(OUTBOX_KEY, []),
      ])
      if (cachedMessages) {
        setMessages((prev) => (prev.length ? prev : cachedMessages.data))
        setCachedAt(cachedMessages.savedAt)
      }
      if (cachedPoll) {
        setActivePoll((prev) => prev ?? cachedPoll.data.poll)
        setVotes((prev) => (Object.keys(prev).length ? prev : cachedPoll.data.votes))
        setMyVote((prev) => prev ?? cachedPoll.data.myVote)
      }
      setMine(mineIds)
      setOutbox(queued)
    })()
  }, [])

  const refreshMessages = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('interaction_messages')
      .select('id, kind, name, body, song, highlighted, created_at')
      .order('created_at', { ascending: false })
      .limit(80)
    if (error) return
    const mapped = (data as MessageRow[]).map(mapMessage)
    setMessages(mapped)
    setCachedAt(null)
    void writeCache(KEYS.cacheMessages, mapped)
  }, [])

  const refreshVotes = useCallback(
    async (poll: LivePoll | null) => {
      if (!supabase || !poll) {
        setVotes({})
        setMyVote(null)
        return
      }
      const { data, error } = await supabase
        .from('poll_votes')
        .select('option_id, voter_key')
        .eq('poll_id', poll.id)
      if (error) return
      const voterKey = await getVoterKey()
      const tally = emptyVotesFor(poll)
      let mineVote: string | null = null
      for (const row of (data ?? []) as { option_id: string; voter_key: string }[]) {
        tally[row.option_id] = (tally[row.option_id] ?? 0) + 1
        if (row.voter_key === voterKey) mineVote = row.option_id
      }
      setVotes(tally)
      setMyVote(mineVote)
      void writeCache(KEYS.cachePoll, { poll, votes: tally, myVote: mineVote })
    },
    [getVoterKey],
  )

  const refreshPoll = useCallback(async () => {
    if (!supabase) return
    const { data: pollRows, error } = await supabase
      .from('polls')
      .select('id, question, active')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) return

    const poll = (pollRows as { id: string; question: string; active: boolean }[] | null)?.[0]
    if (!poll) {
      setActivePoll(null)
      setVotes({})
      setMyVote(null)
      void writeCache(KEYS.cachePoll, { poll: null, votes: {}, myVote: null })
      return
    }

    const { data: optionRows, error: optError } = await supabase
      .from('poll_options')
      .select('id, label, sort_order')
      .eq('poll_id', poll.id)
      .order('sort_order', { ascending: true })
    if (optError) return

    const live: LivePoll = {
      id: poll.id,
      question: poll.question,
      active: poll.active,
      options: ((optionRows as { id: string; label: string }[]) ?? []).map((o) => ({ id: o.id, label: o.label })),
    }
    if (live.options.length < 2) {
      setActivePoll(null)
      return
    }
    setActivePoll(live)
    await refreshVotes(live)
  }, [refreshVotes])

  const refresh = useCallback(async () => {
    await Promise.all([refreshMessages(), refreshPoll()])
  }, [refreshMessages, refreshPoll])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    const channel = client
      .channel('jowi-interact-mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interaction_messages' }, () => {
        void refreshMessages()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => void refreshPoll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => void refreshPoll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_options' }, () => void refreshPoll())
      // Load (and re-sync after reconnects) once realtime settles, even if it failed.
      .subscribe((state) => {
        if (state !== 'CLOSED') void refresh()
      })

    return () => {
      void client.removeChannel(channel)
    }
  }, [refresh, refreshMessages, refreshPoll])

  const rememberMine = useCallback((id: string) => {
    setMine((prev) => {
      const next = [id, ...prev].slice(0, 100)
      void writeJson(MINE_KEY, next)
      return next
    })
  }, [])

  const insertMessage = useCallback(
    async (item: Omit<OutboxItem, 'localId' | 'createdAt'>): Promise<boolean> => {
      if (!supabase) return false
      const { data, error } = await supabase
        .from('interaction_messages')
        .insert({ kind: item.kind, name: item.name, body: item.body, song: item.song ?? null })
        .select('id')
        .single()
      if (error || !data?.id) return false
      rememberMine(data.id as string)
      return true
    },
    [rememberMine],
  )

  const enqueue = useCallback((item: Omit<OutboxItem, 'localId' | 'createdAt'>) => {
    setOutbox((prev) => {
      const next = [...prev, { ...item, localId: `local-${randomId()}`, createdAt: new Date().toISOString() }]
      void writeJson(OUTBOX_KEY, next)
      return next
    })
  }, [])

  // Flush queued messages when we are back online.
  const flushingRef = useRef(false)
  useEffect(() => {
    if (isOffline || !supabase || outbox.length === 0 || flushingRef.current) return
    flushingRef.current = true
    void (async () => {
      const remaining: OutboxItem[] = []
      for (const item of outbox) {
        const sent = await insertMessage(item)
        if (!sent) remaining.push(item)
      }
      setOutbox(remaining)
      await writeJson(OUTBOX_KEY, remaining)
      flushingRef.current = false
      if (remaining.length !== outbox.length) void refreshMessages()
    })()
  }, [isOffline, outbox, insertMessage, refreshMessages])

  const send = useCallback(
    async (item: Omit<OutboxItem, 'localId' | 'createdAt'>): Promise<ActionResult> => {
      if (!supabase) return notConfigured
      if (isOffline) {
        enqueue(item)
        return { ok: true, queued: true }
      }
      const sent = await insertMessage(item)
      if (sent) return { ok: true }
      enqueue(item)
      return { ok: true, queued: true }
    },
    [isOffline, enqueue, insertMessage],
  )

  const sendShoutout = useCallback(
    (name: string, text: string) =>
      send({ kind: 'shoutout', name: name.trim() || 'Listener', body: text.trim() }),
    [send],
  )

  const sendRequest = useCallback(
    (name: string, song: string, dedication = '') =>
      send({
        kind: 'request',
        name: name.trim() || 'Listener',
        body: dedication.trim() || 'Song request',
        song: song.trim(),
      }),
    [send],
  )

  const vote = useCallback(
    async (optionId: string): Promise<ActionResult> => {
      if (!supabase || !activePoll) return notConfigured
      if (isOffline) return { ok: false, error: 'Voting needs a connection.' }
      const previous = myVote
      setMyVote(optionId)
      const voterKey = await getVoterKey()
      const { error } = await supabase
        .from('poll_votes')
        .upsert(
          { poll_id: activePoll.id, option_id: optionId, voter_key: voterKey },
          { onConflict: 'poll_id,voter_key' },
        )
      if (error) {
        setMyVote(previous)
        return { ok: false, error: error.message }
      }
      void refreshVotes(activePoll)
      return { ok: true }
    },
    [activePoll, isOffline, myVote, getVoterKey, refreshVotes],
  )

  const highlightMessage = useCallback(
    async (id: string): Promise<ActionResult> => {
      if (!supabase) return notConfigured
      const current = messages.find((m) => m.id === id)
      const next = !current?.highlighted
      const { data, error } = await supabase
        .from('interaction_messages')
        .update({ highlighted: next })
        .eq('id', id)
        .select('id')
      if (error) return { ok: false, error: error.message }
      if (!data?.length) return { ok: false, error: 'Could not update message (check booth Auth / RLS policies).' }
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, highlighted: next } : m)))
      return { ok: true }
    },
    [messages],
  )

  const deleteMessage = useCallback(async (id: string): Promise<ActionResult> => {
    if (!supabase) return notConfigured
    const { data, error } = await supabase.from('interaction_messages').delete().eq('id', id).select('id')
    if (error) return { ok: false, error: error.message }
    if (!data?.length) return { ok: false, error: 'Could not remove message (check RLS policies).' }
    setMessages((prev) => prev.filter((m) => m.id !== id))
    return { ok: true }
  }, [])

  const clearMessages = useCallback(async (): Promise<ActionResult> => {
    if (!supabase) return notConfigured
    const pending = messages.length
    const { data, error } = await supabase
      .from('interaction_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('id')
    if (error) return { ok: false, error: error.message }
    if (pending > 0 && !data?.length) {
      return { ok: false, error: 'Could not clear inbox (check booth Auth / RLS policies).' }
    }
    setMessages([])
    return { ok: true }
  }, [messages])

  const publishPoll = useCallback(
    async (input: PublishPollInput): Promise<ActionResult> => {
      if (!supabase) return notConfigured
      const question = input.question.trim()
      const options = input.options.map((o) => o.trim()).filter(Boolean)
      if (!question) return { ok: false, error: 'Add a poll question.' }
      if (options.length < 2) return { ok: false, error: 'Add at least two options.' }
      if (options.length > 6) return { ok: false, error: 'Maximum six options.' }

      const pollId = `poll-${randomId().slice(0, 8)}`
      const { error: deactivateError } = await supabase.from('polls').update({ active: false }).eq('active', true)
      if (deactivateError) return { ok: false, error: deactivateError.message }

      const { error: pollError } = await supabase.from('polls').insert({ id: pollId, question, active: true })
      if (pollError) return { ok: false, error: pollError.message }

      const { error: optionsError } = await supabase.from('poll_options').insert(
        options.map((label, index) => ({
          id: slugOptionId(pollId, index, label),
          poll_id: pollId,
          label,
          sort_order: index + 1,
        })),
      )
      if (optionsError) {
        await supabase.from('polls').delete().eq('id', pollId)
        return { ok: false, error: optionsError.message }
      }
      await refreshPoll()
      return { ok: true }
    },
    [refreshPoll],
  )

  const endPoll = useCallback(async (): Promise<ActionResult> => {
    if (!supabase) return notConfigured
    if (!activePoll) return { ok: false, error: 'No live poll to end.' }
    const { data, error } = await supabase
      .from('polls')
      .update({ active: false })
      .eq('id', activePoll.id)
      .select('id')
    if (error) return { ok: false, error: error.message }
    if (!data?.length) return { ok: false, error: 'Could not end poll (check RLS policies).' }
    setActivePoll(null)
    setVotes({})
    setMyVote(null)
    return { ok: true }
  }, [activePoll])

  const resetPollVotes = useCallback(async (): Promise<ActionResult> => {
    if (!supabase) return notConfigured
    if (!activePoll) return { ok: false, error: 'No live poll to reset.' }
    const before = Object.values(votes).reduce((sum, n) => sum + n, 0)
    const { data, error } = await supabase.from('poll_votes').delete().eq('poll_id', activePoll.id).select('id')
    if (error) return { ok: false, error: error.message }
    if (before > 0 && !data?.length) return { ok: false, error: 'Could not reset votes (check RLS policies).' }
    setVotes(emptyVotesFor(activePoll))
    setMyVote(null)
    return { ok: true }
  }, [activePoll, votes])

  const totalVotes = useMemo(() => Object.values(votes).reduce((sum, n) => sum + n, 0), [votes])

  const decorated = useMemo<InteractionMessage[]>(() => {
    const queued: InteractionMessage[] = outbox.map((o) => ({
      id: o.localId,
      kind: o.kind,
      name: o.name,
      text: o.body,
      song: o.song,
      createdAt: o.createdAt,
      mine: true,
      pending: true,
    }))
    const mineSet = new Set(mine)
    return [...queued.reverse(), ...messages.map((m) => (mineSet.has(m.id) ? { ...m, mine: true } : m))]
  }, [messages, mine, outbox])

  const value = useMemo<InteractionApi>(
    () => ({
      messages: decorated,
      activePoll,
      votes,
      myVote,
      totalVotes,
      backendReady,
      cachedAt,
      outboxCount: outbox.length,
      refresh,
      sendShoutout,
      sendRequest,
      vote,
      highlightMessage,
      deleteMessage,
      clearMessages,
      publishPoll,
      endPoll,
      resetPollVotes,
    }),
    [
      decorated,
      activePoll,
      votes,
      myVote,
      totalVotes,
      backendReady,
      cachedAt,
      outbox.length,
      refresh,
      sendShoutout,
      sendRequest,
      vote,
      highlightMessage,
      deleteMessage,
      clearMessages,
      publishPoll,
      endPoll,
      resetPollVotes,
    ],
  )

  return <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>
}

export function useInteraction() {
  const ctx = useContext(InteractionContext)
  if (!ctx) throw new Error('useInteraction must be used within InteractionProvider')
  return ctx
}
