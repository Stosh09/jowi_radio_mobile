import { useEffect, useRef, useState } from 'react'
import { LAYERS } from '../splash/jowiLayers'

const MIN_MS = 1900 // let the whole intro play before leaving
const CAP_MS = 6000 // hard cap: a slow network never traps the user here
const FADE_MS = 250

/** Strip the outer <svg> wrapper so each layer drops into a <g> of the shared 447 viewBox. */
const inner = (key: keyof typeof LAYERS) =>
  LAYERS[key].replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

const PARTS = {
  ground: inner('ground'),
  tail: inner('tail'),
  body: inner('body'),
  head: inner('head'),
  mic: inner('mic'),
  wavesL: inner('wavesL'),
  wavesR: inner('wavesR'),
  text981: inner('text981'),
  textJamuomo: inner('textJamuomo'),
} as const

// Timeline and keyframes taken from docs/jowi-splash-preview.html (the approved reference).
// Selectors are scoped to the splash so page styles stay untouched.
const CSS = `
.jowi-splash{position:fixed;inset:0;z-index:9999;background:#4a0f07;display:flex;align-items:center;justify-content:center;overflow:hidden;opacity:1;transition:opacity ${FADE_MS}ms ease}
.jowi-splash.leaving{opacity:0}
.jowi-splash-stage{width:min(86vw,420px);aspect-ratio:1}
.jowi-splash-stage svg{width:100%;height:100%;overflow:visible}
.jowi-splash-stage svg *{transform-box:view-box}
.jowi-splash-stage #disc,.jowi-splash-stage #ring,.jowi-splash-stage #buffalo,.jowi-splash-stage #tail,.jowi-splash-stage #head,.jowi-splash-stage #mic,.jowi-splash-stage #wavesL,.jowi-splash-stage #wavesR,.jowi-splash-stage #text981,.jowi-splash-stage #textJamuomo,.jowi-splash-stage .dust{opacity:0}
.go #disc{animation:disc .45s cubic-bezier(.2,.8,.2,1) 0s both}
.go #ring{opacity:1}
.go #ringRed{stroke-dasharray:1260;animation:draw .6s ease-out .05s both}
.go #ringBlue{stroke-dasharray:1340;animation:draw .6s ease-out 0s both}
.go #buffalo{animation:slide .55s cubic-bezier(.2,.9,.25,1.15) .3s both}
.go #tail{transform-origin:350px 165px;animation:tailswish .5s ease-in-out .85s both}
.go #head{transform-origin:150px 135px;animation:toss .5s ease-in-out .8s both}
.go #mic{animation:micon .35s ease-out 1s both,micloop 1.2s ease-in-out 1.8s infinite}
.go #wavesL{transform-origin:125px 320px;animation:wave .4s cubic-bezier(.2,.9,.3,1.3) 1.05s both,waveloop 1.2s ease-in-out 1.8s infinite}
.go #wavesR{transform-origin:330px 320px;animation:wave .4s cubic-bezier(.2,.9,.3,1.3) 1.1s both,waveloop 1.2s ease-in-out 1.9s infinite}
.go #text981{transform-origin:228px 322px;animation:pop .35s cubic-bezier(.2,.9,.3,1.4) 1.3s both}
.go #textJamuomo{animation:rise .4s ease-out 1.5s both}
.go .dust{animation:puff .5s ease-out .78s both}
.go #squash{transform-origin:223px 285px;animation:squash .25s ease-out .75s both}
@keyframes disc{from{opacity:0;transform:scale(.85);transform-origin:222px 218px}to{opacity:1;transform:scale(1);transform-origin:222px 218px}}
@keyframes draw{from{stroke-dashoffset:1340}to{stroke-dashoffset:0}}
@keyframes slide{0%{opacity:1;transform:translateX(-210px)}100%{opacity:1;transform:translateX(0)}}
@keyframes squash{0%{transform:scale(1,1)}40%{transform:scale(1.03,.965)}100%{transform:scale(1,1)}}
@keyframes toss{0%{opacity:1;transform:rotate(0)}35%{opacity:1;transform:rotate(6deg)}70%{opacity:1;transform:rotate(-7deg)}100%{opacity:1;transform:rotate(0)}}
@keyframes tailswish{0%{opacity:1;transform:rotate(0)}40%{opacity:1;transform:rotate(12deg)}75%{opacity:1;transform:rotate(-8deg)}100%{opacity:1;transform:rotate(0)}}
@keyframes micon{from{opacity:0;filter:drop-shadow(0 0 0 #6fd3ff)}60%{opacity:1;filter:drop-shadow(0 0 7px #6fd3ff)}to{opacity:1;filter:drop-shadow(0 0 2px #6fd3ff)}}
@keyframes micloop{0%,100%{opacity:1;filter:drop-shadow(0 0 2px #6fd3ff)}50%{opacity:1;filter:drop-shadow(0 0 8px #6fd3ff)}}
@keyframes wave{from{opacity:0;transform:scaleY(.15)}to{opacity:1;transform:scaleY(1)}}
@keyframes waveloop{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:1;transform:scaleY(.7)}}
@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes puff{0%{opacity:.85;transform:scale(.3) translateY(0)}100%{opacity:0;transform:scale(1.5) translateY(-10px)}}
.jowi-splash-stage .dust{fill:#d8c9b2}
.jowi-splash-stage .pulse{opacity:0;fill:none}
.go .pulse{animation:jowi-pulse 1.8s cubic-bezier(.15,.6,.3,1) infinite}
.go #pulseA{animation-delay:1s}.go #pulseB{animation-delay:1.6s}.go #pulseC{animation-delay:2.2s}
@keyframes jowi-pulse{0%{opacity:.95;transform:scale(1)}100%{opacity:0;transform:scale(1.55)}}
.jowi-splash-stage #pulseA,.jowi-splash-stage #pulseB,.jowi-splash-stage #pulseC{transform-origin:222px 218px}
.jowi-splash-stage .dust.a{transform-origin:105px 281px}.jowi-splash-stage .dust.b{transform-origin:170px 283px}.jowi-splash-stage .dust.c{transform-origin:330px 283px}.jowi-splash-stage .dust.d{transform-origin:392px 281px}
@media (prefers-reduced-motion:reduce){
  .go .pulse{animation:none;opacity:0}
  .go #disc,.go #ring,.go #buffalo,.go #squash,.go #tail,.go #head,.go #mic,.go #wavesL,.go #wavesR,.go #text981,.go #textJamuomo{opacity:1;animation:none;transform:none}
  .go #ringRed,.go #ringBlue{animation:none;stroke-dashoffset:0}
  .go .dust{animation:none;opacity:0}
  .go #mic{filter:drop-shadow(0 0 2px #6fd3ff)}
}
`

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [go, setGo] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const finished = useRef(false)
  const t0Ref = useRef(0)

  useEffect(() => {
    if (t0Ref.current === 0) t0Ref.current = Date.now()
    const elapsed = () => Date.now() - t0Ref.current
    const fade = () => {
      if (finished.current) return
      finished.current = true
      setLeaving(true)
      window.setTimeout(onDone, FADE_MS)
    }
    // "App ready" = window load (or already complete), but never before the minimum.
    let loaded = document.readyState === 'complete'
    let minPassed = false
    const tryFade = () => {
      if (loaded && minPassed) fade()
    }
    const minT = window.setTimeout(() => {
      minPassed = true
      tryFade()
    }, Math.max(0, MIN_MS - elapsed()))
    const capT = window.setTimeout(fade, Math.max(0, CAP_MS - elapsed()))
    const onLoad = () => {
      loaded = true
      tryFade()
    }
    if (!loaded) window.addEventListener('load', onLoad)
    // Paint the hidden state first, then add `.go` so the CSS timeline starts clean.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setGo(true))
    })
    return () => {
      window.clearTimeout(minT)
      window.clearTimeout(capT)
      window.removeEventListener('load', onLoad)
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [onDone])

  return (
    <div className={`jowi-splash${leaving ? ' leaving' : ''}`}>
      <style>{CSS}</style>
      <div className={`jowi-splash-stage${go ? ' go' : ''}`}>
        <svg
          viewBox="0 0 447 447"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="JOWI 98.1 Jamuomo"
        >
          <defs>
            <linearGradient id="gA" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff8a1f" />
              <stop offset="1" stopColor="#b3111f" />
            </linearGradient>
            <linearGradient id="gB" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd76e" />
              <stop offset="1" stopColor="#ff7a1a" />
            </linearGradient>
            <linearGradient id="gC" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#1d78b8" />
              <stop offset="1" stopColor="#7fdcff" />
            </linearGradient>
          </defs>
          <circle id="pulseC" className="pulse" cx="222" cy="218" r="220" stroke="url(#gC)" strokeWidth="3" />
          <circle id="pulseB" className="pulse" cx="222" cy="218" r="220" stroke="url(#gB)" strokeWidth="4" />
          <circle id="pulseA" className="pulse" cx="222" cy="218" r="220" stroke="url(#gA)" strokeWidth="6" />
          <circle id="disc" cx="221.8" cy="217.5" r="217.5" fill="#fff" />
          <g id="ring">
            <circle
              id="ringRed"
              cx="222.4"
              cy="218"
              r="200.5"
              fill="none"
              stroke="#a60716"
              strokeWidth="3"
              transform="rotate(-90 222.4 218)"
            />
            <circle
              id="ringBlue"
              cx="221.3"
              cy="217"
              r="212"
              fill="none"
              stroke="#054165"
              strokeWidth="11"
              transform="rotate(-90 221.3 217)"
            />
          </g>
          <g id="buffalo">
            <g id="squash">
              <g id="ground" dangerouslySetInnerHTML={{ __html: PARTS.ground }} />
              <g id="tail" dangerouslySetInnerHTML={{ __html: PARTS.tail }} />
              <g id="body" dangerouslySetInnerHTML={{ __html: PARTS.body }} />
              <g id="head" dangerouslySetInnerHTML={{ __html: PARTS.head }} />
              <g id="mic" dangerouslySetInnerHTML={{ __html: PARTS.mic }} />
              <ellipse className="dust a" cx="105" cy="281" rx="14" ry="7" />
              <ellipse className="dust b" cx="170" cy="283" rx="12" ry="6" />
              <ellipse className="dust c" cx="330" cy="283" rx="12" ry="6" />
              <ellipse className="dust d" cx="392" cy="281" rx="14" ry="7" />
            </g>
          </g>
          <g id="wavesL" dangerouslySetInnerHTML={{ __html: PARTS.wavesL }} />
          <g id="wavesR" dangerouslySetInnerHTML={{ __html: PARTS.wavesR }} />
          <g id="text981" dangerouslySetInnerHTML={{ __html: PARTS.text981 }} />
          <g id="textJamuomo" dangerouslySetInnerHTML={{ __html: PARTS.textJamuomo }} />
        </svg>
      </div>
    </div>
  )
}
