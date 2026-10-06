import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { FALLBACK_POLL } from '../config/station'
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

export type ActionResult = { ok: boolean; error?: string }

export interface PublishPollInput {
  question: string
  options: string[]
}

interface InteractionApi {
  messages: InteractionMessage[]
  activePoll: LivePoll | null
  votes: PollVotes
  myVote: string | null
  totalVotes: number
  backendReady: boolean
  sendShoutout: (name: string, text: string) => Promise<void>
  sendRequest: (name: string, song: string, dedication?: string) => Promise<void>
  vote: (optionId: string) => Promise<void>
  highlightMessage: (id: string) => Promise<ActionResult>
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

interface VoteRow {
  option_id: string
  voter_key: string
}

interface PollRow {
  id: string
  question: string
  active: boolean
}

interface OptionRow {
  id: string
  poll_id: string
  label: string
  sort_order: number
}

const InteractionContext = createContext<InteractionApi | null>(null)
const VOTER_KEY = 'jowi-voter-key'

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

function getVoterKey() {
  try {
    const existing = localStorage.getItem(VOTER_KEY)
    if (existing) return existing
    const next = `v-${crypto.randomUUID()}`
    localStorage.setItem(VOTER_KEY, next)
    return next
  } catch {
    return `v-${Math.random().toString(36).slice(2, 12)}`
  }
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

function tallyVotes(
  rows: VoteRow[],
  poll: LivePoll | null,
): { votes: PollVotes; myVote: string | null } {
  const votes = emptyVotesFor(poll)
  const voterKey = getVoterKey()
  let myVote: string | null = null

  for (const row of rows) {
    votes[row.option_id] = (votes[row.option_id] ?? 0) + 1
    if (row.voter_key === voterKey) myVote = row.option_id
  }

  return { votes, myVote }
}

function slugOptionId(pollId: string, index: number, label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
  return `${pollId}-${index}-${slug || 'opt'}`
}

export function InteractionProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<InteractionMessage[]>([])
  const [activePoll, setActivePoll] = useState<LivePoll | null>(null)
  const [votes, setVotes] = useState<PollVotes>({})
  const [myVote, setMyVote] = useState<string | null>(null)
  const backendReady = isSupabaseConfigured && Boolean(supabase)

  const refreshMessages = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('interaction_messages')
      .select('id, kind, name, body, song, highlighted, created_at')
      .order('created_at', { ascending: false })
      .limit(80)

    if (error) {
      console.error('Failed to load messages', error.message)
      return
    }
    setMessages((data as MessageRow[]).map(mapMessage))
  }, [])

  const refreshVotes = useCallback(async (poll: LivePoll | null) => {
    if (!supabase || !poll) {
      setVotes({})
      setMyVote(null)
      return
    }
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_id, voter_key')
      .eq('poll_id', poll.id)

    if (error) {
      console.error('Failed to load votes', error.message)
      return
    }
    const next = tallyVotes((data ?? []) as VoteRow[], poll)
    setVotes(next.votes)
    setMyVote(next.myVote)
  }, [])

  const refreshPoll = useCallback(async () => {
    if (!supabase) {
      setActivePoll(fallbackPoll())
      return fallbackPoll()
    }

    const { data: pollRows, error: pollError } = await supabase
      .from('polls')
      .select('id, question, active')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (pollError) {
      console.error('Failed to load poll', pollError.message)
      const fb = fallbackPoll()
      setActivePoll(fb)
      return fb
    }

    const poll = (pollRows as PollRow[] | null)?.[0]
    if (!poll) {
      setActivePoll(null)
      setVotes({})
      setMyVote(null)
      return null
    }

    const { data: optionRows, error: optError } = await supabase
      .from('poll_options')
      .select('id, poll_id, label, sort_order')
      .eq('poll_id', poll.id)
      .order('sort_order', { ascending: true })

    if (optError) {
      console.error('Failed to load poll options', optError.message)
      return null
    }

    const live: LivePoll = {
      id: poll.id,
      question: poll.question,
      active: poll.active,
      options: ((optionRows as OptionRow[]) ?? []).map((o) => ({
        id: o.id,
        label: o.label,
      })),
    }

    if (live.options.length < 2) {
      setActivePoll(null)
      setVotes({})
      setMyVote(null)
      return null
    }

    setActivePoll(live)
    await refreshVotes(live)
    return live
  }, [refreshVotes])

  useEffect(() => {
    if (!supabase) {
      setActivePoll(fallbackPoll())
      return
    }
    const client = supabase

    void refreshMessages()
    void refreshPoll()

    const channel = client
      .channel('jowi-interact')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interaction_messages' },
        () => {
          void refreshMessages()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        () => {
          void refreshPoll()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls' },
        () => {
          void refreshPoll()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_options' },
        () => {
          void refreshPoll()
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [refreshMessages, refreshPoll])

  const sendShoutout = useCallback(async (name: string, text: string) => {
    if (!supabase) {
      console.warn('Supabase is not configured')
      return
    }
    const { error } = await supabase.from('interaction_messages').insert({
      kind: 'shoutout',
      name: name.trim() || 'Listener',
      body: text.trim(),
    })
    if (error) console.error('Shoutout failed', error.message)
  }, [])

  const sendRequest = useCallback(
    async (name: string, song: string, dedication = '') => {
      if (!supabase) {
        console.warn('Supabase is not configured')
        return
      }
      const { error } = await supabase.from('interaction_messages').insert({
        kind: 'request',
        name: name.trim() || 'Listener',
        body: dedication.trim() || 'Song request',
        song: song.trim(),
      })
      if (error) console.error('Request failed', error.message)
    },
    [],
  )

  const vote = useCallback(
    async (optionId: string) => {
      if (!supabase || !activePoll) return
      const voterKey = getVoterKey()
      const { error } = await supabase.from('poll_votes').upsert(
        {
          poll_id: activePoll.id,
          option_id: optionId,
          voter_key: voterKey,
        },
        { onConflict: 'poll_id,voter_key' },
      )
      if (error) console.error('Vote failed', error.message)
      else {
        setMyVote(optionId)
        void refreshVotes(activePoll)
      }
    },
    [activePoll, refreshVotes],
  )

  const highlightMessage = useCallback(
    async (id: string): Promise<ActionResult> => {
      if (!supabase) return { ok: false, error: 'Supabase is not configured' }
      const current = messages.find((m) => m.id === id)
      const next = !current?.highlighted
      const { data, error } = await supabase
        .from('interaction_messages')
        .update({ highlighted: next })
        .eq('id', id)
        .select('id')

      if (error) {
        console.error('Highlight failed', error.message)
        return { ok: false, error: error.message }
      }
      if (!data?.length) {
        return {
          ok: false,
          error: 'Could not update message (check booth Auth / RLS policies).',
        }
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, highlighted: next } : m)),
      )
      return { ok: true }
    },
    [messages],
  )

  const clearMessages = useCallback(async (): Promise<ActionResult> => {
    if (!supabase) return { ok: false, error: 'Supabase is not configured' }

    const pending = messages.length
    const { data, error } = await supabase
      .from('interaction_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('id')

    if (error) {
      console.error('Clear failed', error.message)
      return { ok: false, error: error.message }
    }
    if (pending > 0 && !data?.length) {
      return {
        ok: false,
        error: 'Could not clear inbox (check booth Auth / RLS policies).',
      }
    }
    setMessages([])
    return { ok: true }
  }, [messages])

  const publishPoll = useCallback(
    async (input: PublishPollInput): Promise<ActionResult> => {
      if (!supabase) return { ok: false, error: 'Supabase is not configured' }

      const question = input.question.trim()
      const options = input.options.map((o) => o.trim()).filter(Boolean)
      if (!question) return { ok: false, error: 'Add a poll question.' }
      if (options.length < 2) return { ok: false, error: 'Add at least two options.' }
      if (options.length > 6) return { ok: false, error: 'Maximum six options.' }

      const pollId = `poll-${crypto.randomUUID().slice(0, 8)}`

      const { error: deactivateError } = await supabase
        .from('polls')
        .update({ active: false })
        .eq('active', true)

      if (deactivateError) {
        return { ok: false, error: deactivateError.message }
      }

      const { error: pollError } = await supabase.from('polls').insert({
        id: pollId,
        question,
        active: true,
      })

      if (pollError) {
        return { ok: false, error: pollError.message }
      }

      const optionRows = options.map((label, index) => ({
        id: slugOptionId(pollId, index, label),
        poll_id: pollId,
        label,
        sort_order: index + 1,
      }))

      const { error: optionsError } = await supabase.from('poll_options').insert(optionRows)
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
    if (!supabase) return { ok: false, error: 'Supabase is not configured' }
    if (!activePoll) return { ok: false, error: 'No live poll to end.' }

    const { data, error } = await supabase
      .from('polls')
      .update({ active: false })
      .eq('id', activePoll.id)
      .select('id')

    if (error) return { ok: false, error: error.message }
    if (!data?.length) {
      return { ok: false, error: 'Could not end poll (check RLS policies).' }
    }

    setActivePoll(null)
    setVotes({})
    setMyVote(null)
    return { ok: true }
  }, [activePoll])

  const resetPollVotes = useCallback(async (): Promise<ActionResult> => {
    if (!supabase) return { ok: false, error: 'Supabase is not configured' }
    if (!activePoll) return { ok: false, error: 'No live poll to reset.' }

    const before = Object.values(votes).reduce((sum, n) => sum + n, 0)
    const { data, error } = await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', activePoll.id)
      .select('id')

    if (error) return { ok: false, error: error.message }
    if (before > 0 && !data?.length) {
      return { ok: false, error: 'Could not reset votes (check RLS policies).' }
    }

    setVotes(emptyVotesFor(activePoll))
    setMyVote(null)
    return { ok: true }
  }, [activePoll, votes])

  const totalVotes = useMemo(
    () => Object.values(votes).reduce((sum, n) => sum + n, 0),
    [votes],
  )

  const value = useMemo(
    () => ({
      messages,
      activePoll,
      votes,
      myVote,
      totalVotes,
      backendReady,
      sendShoutout,
      sendRequest,
      vote,
      highlightMessage,
      clearMessages,
      publishPoll,
      endPoll,
      resetPollVotes,
    }),
    [
      messages,
      activePoll,
      votes,
      myVote,
      totalVotes,
      backendReady,
      sendShoutout,
      sendRequest,
      vote,
      highlightMessage,
      clearMessages,
      publishPoll,
      endPoll,
      resetPollVotes,
    ],
  )

  return (
    <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>
  )
}

export function useInteraction() {
  const ctx = useContext(InteractionContext)
  if (!ctx) {
    throw new Error('useInteraction must be used within InteractionProvider')
  }
  return ctx
}
