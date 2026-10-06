export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-jowi-live px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white live-pulse ${className}`}
    >
      Live
    </span>
  )
}
