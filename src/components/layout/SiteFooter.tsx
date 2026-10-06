import { Link } from 'react-router-dom'
import { STATION } from '../../config/station'
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from '../SocialIcons'

const socialLinkClass =
  'inline-flex items-center justify-center rounded-md bg-white/10 p-2.5 text-white transition hover:bg-white/20'

export function SiteFooter() {
  const wa = `https://wa.me/${STATION.about.whatsapp}`

  return (
    <footer className="relative z-10 mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
        <div>
          <p className="font-display text-2xl uppercase text-white">{STATION.name}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-jowi-muted">
            {STATION.about.blurb}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jowi-gold">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm text-jowi-muted">
            <li>
              <Link to="/schedule" className="hover:text-white">
                Schedule
              </Link>
            </li>
            <li>
              <Link to="/interact" className="hover:text-white">
                Shoutouts & requests
              </Link>
            </li>
            <li>
              <Link to="/advertise" className="hover:text-white">
                Advertise with us
              </Link>
            </li>
            <li>
              <Link to="/booth" className="hover:text-white">
                Presenter booth
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jowi-gold">
            Connect
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
              className="inline-flex items-center gap-2 rounded-md bg-jowi-gold px-3 py-2 text-sm font-semibold text-black hover:bg-jowi-gold-dark"
            >
              <WhatsappIcon size={16} />
              WhatsApp
            </a>
            <a
              href={STATION.social.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className={socialLinkClass}
            >
              <FacebookIcon size={18} />
            </a>
            <a
              href={STATION.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className={socialLinkClass}
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href={STATION.social.youtube}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className={socialLinkClass}
            >
              <YoutubeIcon size={18} />
            </a>
            <a
              href={STATION.social.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              title="TikTok"
              className={socialLinkClass}
            >
              <TiktokIcon size={18} />
            </a>
          </div>
          <p className="mt-4 text-sm text-jowi-muted">{STATION.about.email}</p>
          <p className="text-sm text-jowi-muted">{STATION.about.phone}</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-jowi-muted">
        © {new Date().getFullYear()} {STATION.name}. All rights reserved.
      </div>
    </footer>
  )
}
