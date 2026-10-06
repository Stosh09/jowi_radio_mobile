import { Outlet, useLocation } from 'react-router-dom'
import { MiniPlayer } from './MiniPlayer'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function Layout() {
  const { pathname } = useLocation()
  const isBooth = pathname.startsWith('/booth')

  return (
    <div className="atmosphere relative flex min-h-screen flex-col">
      <div
        className="relative z-10 flex min-h-screen flex-col pb-[calc(7.75rem+env(safe-area-inset-bottom))] md:pb-24"
      >
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        {!isBooth && <SiteFooter />}
      </div>
      <MiniPlayer />
    </div>
  )
}
