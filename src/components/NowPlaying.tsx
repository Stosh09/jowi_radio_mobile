import { useNowPlaying } from '../hooks/useNowPlaying'

interface NowPlayingProps {
  align?: 'left' | 'center'
  size?: 'default' | 'compact'
}

export function NowPlaying({ align = 'left', size = 'default' }: NowPlayingProps) {
  const { current } = useNowPlaying()
  const title = current?.title ?? 'JOWI Live'
  const host = current?.host ?? 'The booth'

  return (
    <div className={`space-y-1 ${align === 'center' ? 'text-center' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jowi-muted">
        Now Playing
      </p>
      <h2
        className={
          size === 'compact'
            ? 'text-xl font-semibold leading-tight text-white'
            : 'text-3xl font-semibold leading-tight text-white md:text-4xl'
        }
      >
        {title}
      </h2>
      <p className={size === 'compact' ? 'text-sm text-jowi-muted' : 'text-lg text-jowi-muted md:text-xl'}>
        with {host}
      </p>
    </div>
  )
}
