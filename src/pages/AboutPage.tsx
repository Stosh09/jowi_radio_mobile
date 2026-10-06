import { WhatsappIcon } from '../components/SocialIcons'
import { STATION } from '../config/station'

export function AboutPage() {
  const wa = `https://wa.me/${STATION.about.whatsapp}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
        Our story
      </p>
      <h1 className="mt-2 font-display text-4xl uppercase text-white md:text-5xl">
        About {STATION.shortName}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-jowi-muted">
        {STATION.about.blurb}
      </p>

      <dl className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="border-t border-jowi-gold pt-4">
          <dt className="text-xs uppercase tracking-wider text-jowi-muted">Frequency</dt>
          <dd className="mt-1 font-display text-2xl text-white">{STATION.frequency}</dd>
        </div>
        <div className="border-t border-jowi-gold pt-4">
          <dt className="text-xs uppercase tracking-wider text-jowi-muted">Based in</dt>
          <dd className="mt-1 font-display text-2xl text-white">{STATION.about.location}</dd>
        </div>
        <div className="border-t border-jowi-gold pt-4">
          <dt className="text-xs uppercase tracking-wider text-jowi-muted">On air since</dt>
          <dd className="mt-1 font-display text-2xl text-white">{STATION.about.founded}</dd>
        </div>
      </dl>

      <section className="mt-14 max-w-xl">
        <h2 className="font-display text-2xl uppercase text-white">Contact the studio</h2>
        <p className="mt-3 text-jowi-muted">
          Email{' '}
          <a className="text-jowi-gold hover:underline" href={`mailto:${STATION.about.email}`}>
            {STATION.about.email}
          </a>
        </p>
        <p className="mt-2 text-jowi-muted">
          Call{' '}
          <a className="text-jowi-gold hover:underline" href={`tel:${STATION.about.phone}`}>
            {STATION.about.phone}
          </a>
        </p>
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-jowi-gold px-5 py-3 text-sm font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark"
        >
          <WhatsappIcon size={18} />
          Chat on WhatsApp
        </a>
      </section>
    </div>
  )
}
