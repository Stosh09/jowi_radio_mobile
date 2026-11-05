import { lazy, Suspense } from 'react'
import { useEffect, useState } from 'react'
import { SplashScreen } from './components/SplashScreen'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AudioPlayerProvider } from './context/AudioPlayerContext'
import { InteractionProvider } from './context/InteractionContext'
import { NewsBulletinProvider } from './context/NewsBulletinContext'
import { PresenterAuthProvider } from './context/PresenterAuthContext'

const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
)
const SchedulePage = lazy(() =>
  import('./pages/SchedulePage').then((m) => ({ default: m.SchedulePage })),
)
const PresentersPage = lazy(() =>
  import('./pages/PresentersPage').then((m) => ({ default: m.PresentersPage })),
)
const InteractPage = lazy(() =>
  import('./pages/InteractPage').then((m) => ({ default: m.InteractPage })),
)
const AdvertisePage = lazy(() =>
  import('./pages/AdvertisePage').then((m) => ({ default: m.AdvertisePage })),
)
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })),
)
const BoothPage = lazy(() =>
  import('./pages/BoothPage').then((m) => ({ default: m.BoothPage })),
)

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-jowi-muted">
      Loading…
    </div>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem('jowi-splash-shown') } catch { return true }
  })
  useEffect(() => {
    if (!showSplash) return
    try { sessionStorage.setItem('jowi-splash-shown', '1') } catch {}
  }, [showSplash])
  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <BrowserRouter>
      <PresenterAuthProvider>
        <AudioPlayerProvider>
          <InteractionProvider>
            <NewsBulletinProvider>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="schedule" element={<SchedulePage />} />
                    <Route path="presenters" element={<PresentersPage />} />
                    <Route path="interact" element={<InteractPage />} />
                    <Route path="advertise" element={<AdvertisePage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="booth" element={<BoothPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </NewsBulletinProvider>
          </InteractionProvider>
        </AudioPlayerProvider>
      </PresenterAuthProvider>
      </BrowserRouter>
    </>
  )
}
