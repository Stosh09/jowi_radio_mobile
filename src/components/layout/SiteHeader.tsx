import { Menu, Radio, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { STATION } from '../../config/station'
import { usePresenterAuth } from '../../context/PresenterAuthContext'

const NAV = [
  { to: '/', label: 'Listen', end: true },
  { to: '/schedule', label: 'Schedule' },
  { to: '/presenters', label: 'Presenters' },
  { to: '/interact', label: 'Interact' },
  { to: '/advertise', label: 'Advertise' },
  { to: '/about', label: 'About' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { isPresenter } = usePresenterAuth()

  return (
    <header className="relative z-30 border-b border-white/10 bg-jowi-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3 md:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={() => setOpen(false)}>
          <img
            src={STATION.logo}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full bg-white object-contain p-0.5 ring-1 ring-jowi-gold/40 sm:h-10 sm:w-10"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-base uppercase tracking-wide text-white sm:text-lg">
              {STATION.shortName}{' '}
              <span className="text-jowi-gold">{STATION.frequency}</span>
            </p>
            <p className="truncate font-script text-xs text-jowi-gold sm:text-sm">{STATION.tagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-jowi-gold/15 text-jowi-gold'
                    : 'text-jowi-muted hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isPresenter && (
            <NavLink
              to="/booth"
              className={({ isActive }) =>
                `ml-1 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-jowi-live/20 text-red-300'
                    : 'text-jowi-muted hover:text-white'
                }`
              }
            >
              <Radio size={14} />
              Booth
            </NavLink>
          )}
        </nav>

        <button
          type="button"
          className="rounded-md p-2 text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-jowi-card px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-3 text-base font-medium ${
                    isActive ? 'bg-jowi-gold/15 text-jowi-gold' : 'text-jowi-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isPresenter && (
              <NavLink
                to="/booth"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-red-300"
              >
                Booth desk
              </NavLink>
            )}
            <Link
              to="/booth"
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm text-jowi-muted"
            >
              Presenter login
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
