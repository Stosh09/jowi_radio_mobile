import { ExternalLink } from 'lucide-react'
import { AD_PACKAGES, STATION } from '../config/station'
import type { BannerAd } from '../config/banners'

/** Static creative shown in the Advertise page mockup (not live inventory). */
const MOCK_BANNER: BannerAd = {
  id: 'mock-your-brand',
  active: true,
  advertiser: 'Your Business Name',
  headline: 'Your offer reaches listeners here',
  tagline: 'Always visible on the live listen page · Above the player',
  ctaLabel: 'Learn more',
  href: '#banner-rates',
  weight: 1,
}

export function AdvertisePage() {
  const mail = `mailto:${STATION.about.email}?subject=${encodeURIComponent('Advertising inquiry — JOWI 98.1 FM')}`
  const bannerPkg = AD_PACKAGES.find((p) => p.id === 'banner')
  const otherPackages = AD_PACKAGES.filter((p) => p.id !== 'banner')

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
        Grow with us
      </p>
      <h1 className="mt-2 font-display text-4xl uppercase text-white md:text-5xl">
        Advertise on JOWI
      </h1>
      <p className="mt-3 max-w-2xl text-jowi-muted">
        Reach local listeners on air and on the live listen page. Rates below are community-station
        starting prices in KES — final quotes depend on dates, length, and peak demand.
      </p>

      <section id="banner-rates" className="mt-12 scroll-mt-24">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
              Featured · Digital
            </p>
            <h2 className="mt-2 font-display text-3xl uppercase text-white md:text-4xl">
              {bannerPkg?.name}
            </h2>
            <p className="mt-2 text-2xl font-semibold text-jowi-gold">{bannerPkg?.price}</p>
            <p className="mt-1 text-sm text-jowi-muted">{bannerPkg?.priceNote}</p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-jowi-muted">
              {bannerPkg?.description}
            </p>
            <ul className="mt-5 space-y-2">
              {bannerPkg?.perks.map((perk) => (
                <li key={perk} className="text-sm text-jowi-ink">
                  <span className="mr-2 text-jowi-gold">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
            <a
              href={mail}
              className="mt-6 inline-block rounded-md bg-jowi-gold px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark"
            >
              Book listen banner
            </a>
          </div>

          <BannerPlacementMockup />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl uppercase text-white md:text-3xl">
          On-air &amp; campaign packages
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-jowi-muted">
          Pair a listen banner with spots or sponsorship for the strongest local push.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {otherPackages.map((pkg) => (
            <article
              key={pkg.id}
              className="flex flex-col border border-white/10 bg-jowi-card/50 p-6"
            >
              <h3 className="font-display text-2xl uppercase text-white">{pkg.name}</h3>
              <p className="mt-2 text-lg font-semibold text-jowi-gold">{pkg.price}</p>
              <p className="mt-1 text-xs text-jowi-muted">{pkg.priceNote}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-jowi-muted">
                {pkg.description}
              </p>
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-5">
                {pkg.perks.map((perk) => (
                  <li key={perk} className="text-sm text-jowi-ink">
                    <span className="mr-2 text-jowi-gold">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 border border-jowi-gold/30 bg-jowi-gold/10 p-6 md:p-8">
        <h2 className="font-display text-2xl uppercase text-white">Request a media kit</h2>
        <p className="mt-2 max-w-xl text-jowi-muted">
          Send your brand, budget window, and preferred dates. Sales confirms inventory and sends
          artwork specs for the listen banner (logo PNG + short headline).
        </p>
        <a
          href={mail}
          className="mt-6 inline-block rounded-md bg-jowi-gold px-6 py-3 text-sm font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark"
        >
          Email advertising team
        </a>
        <p className="mt-3 text-sm text-jowi-muted">
          Or call {STATION.about.phone} during office hours.
        </p>
      </section>
    </div>
  )
}

function BannerPlacementMockup() {
  return (
    <div className="relative">
      <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-jowi-muted">
        Mockup · Listen page placement
      </p>
      <div className="overflow-hidden rounded-xl border border-white/15 bg-jowi-bg shadow-2xl shadow-black/50">
        <div className="flex items-center gap-2 border-b border-white/10 bg-jowi-panel px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-2 flex-1 truncate rounded bg-black/40 px-2 py-1 text-[10px] text-jowi-muted">
            jowi981.fm — Live
          </span>
        </div>

        <div className="relative bg-gradient-to-b from-jowi-panel/80 to-jowi-bg px-4 pb-3 pt-5">
          <div className="mb-4 flex items-center gap-3 opacity-80">
            <img
              src={STATION.logo}
              alt=""
              className="h-10 w-10 rounded-full bg-white object-contain p-0.5"
            />
            <div>
              <p className="font-display text-lg uppercase leading-none text-white">
                {STATION.shortName}{' '}
                <span className="text-jowi-gold">{STATION.frequency}</span>
              </p>
              <p className="text-[11px] text-jowi-muted">Now playing · live show</p>
            </div>
          </div>

          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/5 rounded-full bg-jowi-gold/80" />
          </div>
          <div className="mb-5 flex justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-jowi-gold text-xs font-bold text-black">
              ▶
            </div>
          </div>

          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-jowi-gold">
            Your ad sits here
          </p>
          <MockDockBanner ad={MOCK_BANNER} />

          <div className="mt-2 flex items-center gap-3 rounded-md border border-white/10 bg-jowi-card/90 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-jowi-gold text-[10px] font-bold text-black">
              ▶
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] uppercase tracking-wider text-jowi-gold">Live now</p>
              <p className="truncate text-xs text-white">Your brand · live session</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-jowi-muted">
        Shown above the mini-player on every listen session
      </p>
    </div>
  )
}

function MockDockBanner({ ad }: { ad: BannerAd }) {
  return (
    <div className="rounded-md border border-jowi-gold/40 bg-jowi-card ring-2 ring-jowi-gold/20">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <p className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-jowi-muted">
          Ad
        </p>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-jowi-gold/15 font-display text-xs uppercase text-jowi-gold ring-1 ring-jowi-gold/30">
          YB
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-jowi-muted">{ad.advertiser}</p>
          <p className="truncate text-sm font-medium text-white">{ad.headline}</p>
          <p className="truncate text-xs text-jowi-muted">{ad.tagline}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 rounded-md bg-jowi-gold px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black sm:inline-flex">
          {ad.ctaLabel}
          <ExternalLink size={10} aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}
