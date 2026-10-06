import { useState, type FormEvent } from 'react'
import { useInteraction } from '../context/InteractionContext'

export function InteractPage() {
  const { backendReady } = useInteraction()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
        Studio line
      </p>
      <h1 className="mt-2 font-display text-4xl uppercase text-white md:text-5xl">
        Interact
      </h1>
      <p className="mt-3 max-w-2xl text-jowi-muted">
        Shout out a friend, request a song, or vote in the live poll. Presenters pick messages up
        from the booth desk.
      </p>
      {!backendReady && (
        <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Supabase is not connected yet. Add your URL and publishable key to <code>.env</code>, then
          run <code>supabase/schema.sql</code> in the SQL Editor.
        </p>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <ShoutoutForm />
        <RequestForm />
      </div>

      <LivePoll />
      <PublicFeed />
    </div>
  )
}

function ShoutoutForm() {
  const { sendShoutout } = useInteraction()
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim()) return
    void sendShoutout(name, text)
    setText('')
    setSent(true)
    window.setTimeout(() => setSent(false), 2500)
  }

  return (
    <form onSubmit={onSubmit} className="border border-white/10 bg-jowi-card/40 p-6">
      <h2 className="font-display text-xl uppercase text-white">Shoutout</h2>
      <p className="mt-1 text-sm text-jowi-muted">Send a message the DJ can read on air.</p>
      <label className="mt-5 block text-xs uppercase tracking-wider text-jowi-muted">
        Your name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
          placeholder="Optional"
        />
      </label>
      <label className="mt-4 block text-xs uppercase tracking-wider text-jowi-muted">
        Message
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={3}
          className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
          placeholder="Big up the Morning Show from…"
        />
      </label>
      <button
        type="submit"
        className="mt-4 rounded-md bg-jowi-gold px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark"
      >
        {sent ? 'Sent to booth!' : 'Send shoutout'}
      </button>
    </form>
  )
}

function RequestForm() {
  const { sendRequest } = useInteraction()
  const [name, setName] = useState('')
  const [song, setSong] = useState('')
  const [dedication, setDedication] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!song.trim()) return
    void sendRequest(name, song, dedication)
    setSong('')
    setDedication('')
    setSent(true)
    window.setTimeout(() => setSent(false), 2500)
  }

  return (
    <form onSubmit={onSubmit} className="border border-white/10 bg-jowi-card/40 p-6">
      <h2 className="font-display text-xl uppercase text-white">Song request</h2>
      <p className="mt-1 text-sm text-jowi-muted">Ask the booth to spin your track.</p>
      <label className="mt-5 block text-xs uppercase tracking-wider text-jowi-muted">
        Your name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
          placeholder="Optional"
        />
      </label>
      <label className="mt-4 block text-xs uppercase tracking-wider text-jowi-muted">
        Song / artist
        <input
          value={song}
          onChange={(e) => setSong(e.target.value)}
          required
          className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
          placeholder="Artist — Title"
        />
      </label>
      <label className="mt-4 block text-xs uppercase tracking-wider text-jowi-muted">
        Dedication (optional)
        <input
          value={dedication}
          onChange={(e) => setDedication(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-jowi-gold"
          placeholder="For Mum in town…"
        />
      </label>
      <button
        type="submit"
        className="mt-4 rounded-md bg-jowi-gold px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark"
      >
        {sent ? 'Request sent!' : 'Send request'}
      </button>
    </form>
  )
}

function LivePoll() {
  const { activePoll, votes, myVote, totalVotes, vote, backendReady } = useInteraction()

  if (!backendReady) {
    return (
      <p className="mt-10 text-sm text-jowi-muted">
        Live poll is unavailable until Supabase is connected.
      </p>
    )
  }

  if (!activePoll) {
    return (
      <p className="mt-10 text-sm text-jowi-muted">
        No live poll right now — check back during the show.
      </p>
    )
  }

  return (
    <section className="mt-10 border border-white/10 bg-black/30 p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
        Live poll
      </p>
      <h2 className="mt-2 font-display text-2xl uppercase text-white">
        {activePoll.question}
      </h2>
      <ul className="mt-6 space-y-3">
        {activePoll.options.map((option) => {
          const count = votes[option.id] ?? 0
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0
          const selected = myVote === option.id
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => void vote(option.id)}
                className={`relative w-full overflow-hidden rounded-md border px-4 py-3 text-left transition ${
                  selected
                    ? 'border-jowi-gold bg-jowi-gold/10'
                    : 'border-white/15 hover:border-white/30'
                }`}
              >
                <span
                  className="absolute inset-y-0 left-0 bg-jowi-gold/20"
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
                <span className="relative flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-white">{option.label}</span>
                  <span className="tabular-nums text-jowi-muted">
                    {pct}% · {count}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs text-jowi-muted">
        {totalVotes} vote{totalVotes === 1 ? '' : 's'} so far
        {myVote ? ' · thanks for voting' : ''}
      </p>
    </section>
  )
}

function PublicFeed() {
  const { messages } = useInteraction()
  const recent = messages.slice(0, 8)

  if (recent.length === 0) {
    return (
      <p className="mt-10 text-sm text-jowi-muted">
        No messages yet — be the first to shout out the booth.
      </p>
    )
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl uppercase text-white">Recent from listeners</h2>
      <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
        {recent.map((m) => (
          <li key={m.id} className="py-4">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-jowi-muted">
              <span className={m.kind === 'request' ? 'text-jowi-accent' : 'text-jowi-gold'}>
                {m.kind}
              </span>
              <span>·</span>
              <span>{m.name}</span>
            </div>
            {m.song && <p className="mt-1 font-medium text-white">{m.song}</p>}
            <p className="mt-1 text-sm text-jowi-muted">{m.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
