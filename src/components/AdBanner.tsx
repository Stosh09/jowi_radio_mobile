import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getActiveBanners, pickBanner, type BannerAd } from '../config/banners'

const ROTATE_MS = 12_000

interface AdBannerProps {
  /** Rotate among active creatives (default true when more than one). */
  rotate?: boolean
  /**
   * `dock` — slim bar fixed above the mini-player (always in view on listen).
   * `inline` — full-width strip in page flow.
   */
  variant?: 'dock' | 'inline'
}

export function AdBanner({ rotate = true, variant = 'inline' }: AdBannerProps) {
  const [ad, setAd] = useState<BannerAd | null>(() => pickBanner(getActiveBanners()))

  useEffect(() => {
    const active = getActiveBanners()
    if (active.length === 0) {
      setAd(null)
      return
    }

    if (!rotate || active.length === 1) {
      setAd(pickBanner(active))
      return
    }

    const id = window.setInterval(() => {
      setAd(pickBanner(getActiveBanners()))
    }, ROTATE_MS)

    return () => window.clearInterval(id)
  }, [rotate])

  if (!ad) return null

  const isDock = variant === 'dock'

  return (
    <aside
      className={
        isDock
          ? 'fixed inset-x-0 z-40 border-t border-white/10 bg-jowi-card/95 backdrop-blur-md bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-[4.25rem]'
          : 'border-y border-white/10 bg-jowi-panel/80'
      }
      aria-label="Sponsored advertisement"
    >
      <div
        className={`mx-auto flex max-w-6xl items-center gap-3 px-4 md:gap-4 md:px-6 ${
          isDock ? 'py-2.5 md:py-3' : 'flex-col gap-3 py-3 md:flex-row md:gap-5 md:py-3.5'
        }`}
      >
        <p className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-jowi-muted sm:block">
          Ad
        </p>

        <a
          href={ad.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-jowi-gold md:gap-4"
        >
          {ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt=""
              className={`shrink-0 rounded-md object-cover ring-1 ring-white/15 ${
                isDock ? 'h-11 w-11' : 'h-12 w-12'
              }`}
            />
          ) : (
            <div
              className={`flex shrink-0 items-center justify-center rounded-md bg-jowi-gold/15 font-display uppercase text-jowi-gold ring-1 ring-jowi-gold/30 ${
                isDock ? 'h-11 w-11 text-xs' : 'h-12 w-12 text-sm'
              }`}
              aria-hidden="true"
            >
              {ad.advertiser.slice(0, 2)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {isDock ? (
              <>
                <p className="truncate text-xs text-jowi-muted">{ad.advertiser}</p>
                <p className="truncate text-base font-medium text-white group-hover:text-jowi-gold">
                  {ad.headline}
                </p>
                <p className="hidden truncate text-sm text-jowi-muted sm:block">{ad.tagline}</p>
              </>
            ) : (
              <>
                <p className="truncate text-xs text-jowi-muted">{ad.advertiser}</p>
                <p className="truncate font-medium text-white group-hover:text-jowi-gold">
                  {ad.headline}
                </p>
                <p className="truncate text-sm text-jowi-muted">{ad.tagline}</p>
              </>
            )}
          </div>

          <span
            className={`shrink-0 items-center gap-1.5 rounded-md font-bold uppercase tracking-wide ${
              isDock
                ? 'inline-flex bg-jowi-gold px-3 py-2 text-xs text-black'
                : 'hidden bg-jowi-gold px-3 py-2 text-xs text-black sm:inline-flex'
            }`}
          >
            {ad.ctaLabel}
            <ExternalLink size={12} aria-hidden="true" />
          </span>
        </a>
      </div>
    </aside>
  )
}
