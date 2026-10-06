interface LiveProgressBarProps {
  elapsed: string
}

export function LiveProgressBar({ elapsed }: LiveProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-jowi-gold" />
        <div className="absolute inset-y-0 left-[40%] w-1 animate-pulse rounded-full bg-jowi-gold" />
      </div>
      <div className="flex items-center justify-between text-xs text-jowi-muted">
        <span className="font-mono tabular-nums">{elapsed}</span>
        <span className="font-bold uppercase tracking-wider text-jowi-live">Live</span>
      </div>
    </div>
  )
}
