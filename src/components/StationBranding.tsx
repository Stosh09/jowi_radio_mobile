import { STATION } from '../config/station'
import { LiveBadge } from './LiveBadge'

interface StationBrandingProps {
  variant?: 'sidebar' | 'mobile'
}

export function StationBranding({ variant = 'sidebar' }: StationBrandingProps) {
  const isMobile = variant === 'mobile'

  return (
    <div
      className={`relative flex flex-col items-center ${
        isMobile ? 'px-6 pt-8 pb-4' : 'h-full justify-center px-8 py-10'
      }`}
    >
      {!isMobile && (
        <div className="absolute inset-x-0 top-0 h-1 bg-jowi-gold" aria-hidden="true" />
      )}

      <LiveBadge className="absolute right-4 top-4" />

      {!isMobile && (
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold tracking-wide text-white">{STATION.name}</h1>
          <p className="mt-1 font-script text-lg text-jowi-gold">{STATION.tagline}</p>
        </div>
      )}

      <div
        className={`overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-jowi-gold/30 ${
          isMobile ? 'h-32 w-32' : 'h-40 w-40'
        }`}
      >
        <img
          src={STATION.logo}
          alt={`${STATION.name} logo`}
          className="h-full w-full object-contain p-1"
        />
      </div>

      {isMobile && (
        <div className="mt-5 text-center">
          <h1 className="text-2xl font-bold tracking-wide text-white">{STATION.name}</h1>
          <p className="mt-1 font-script text-xl text-jowi-gold">{STATION.tagline}</p>
        </div>
      )}
    </div>
  )
}
