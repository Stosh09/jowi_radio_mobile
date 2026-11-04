# JOWI 98.1 FM — Station Website

Community radio website for **JOWI 98.1 FM** (`jamuomo...`). Listeners stream live, browse the schedule and presenters, shout out the booth, and see sponsored banners. Presenters use a PIN-gated booth desk for on-air news and the Interact inbox. Sales use the Advertise page for rate cards and a listen-banner mockup.

The live audio source is the station’s [MyRadioStream](https://s23.myradiostream.com:20542/listen.mp3) Icecast mount, wrapped in a custom React UI.

---

## Features

### For listeners
- **Live player** — Play / pause, volume, reconnect, elapsed live timer, sticky mini-player across all pages
- **Brand-first home** — Full-bleed listen hero with station logo, now playing, share “I’m listening”
- **Schedule** — Weekday and weekend program guide
- **Presenters** — Host bios and shows
- **Interact** — Shoutouts, song requests, live poll, recent listener feed
- **Advertise** — Rate card (listen banner, spots, sponsorship, campaigns) + placement mockup
- **About / contact** — Station story, email, phone, WhatsApp, social links
- **PWA** — Installable progressive web app (`vite-plugin-pwa`)

### For advertisers
- **Listen banner dock** — Sponsored strip fixed above the mini-player on the home listen screen (always visible while streaming, does not cover the brand hero)
- **Config-driven creatives** — Activate, date-window, weight, and rotate ads without layout changes
- **Advertise page** — Realistic KES packages and a visual mockup of banner placement

### For presenters (staff)
- **Booth desk** (`/booth`) — PIN login (Supabase Auth when booth user exists)
- **Show strip** — on air, up next, live listener count
- **News for air** — bulletins with focus read, mark used, add/edit/archive (not shown on public listener pages)
- **Interact inbox** — filters, flag for air, clear; live poll totals

---

## Tech stack

| Layer | Choice | Notes |
|-------|--------|--------|
| UI | React 19 + TypeScript | SPA |
| Build | Vite 8 | Fast HMR and production build |
| Routing | React Router 7 | Multi-page station site |
| Styling | Tailwind CSS v4 | Brand tokens (`jowi-gold`, etc.) |
| Icons | Lucide React | Player and UI icons |
| PWA | vite-plugin-pwa | Manifest + service worker |
| Lint | Oxlint | `npm run lint` |

**Fonts:** Syne (display) + Outfit (body) + Caveat (tagline accent) via Google Fonts.

---

## Requirements

- Node.js 20+ recommended
- npm

### Windows PowerShell note

If `npm run dev` fails with *“running scripts is disabled”*, PowerShell is blocking `npm.ps1`. Use:

```powershell
npm.cmd run dev
```

Or allow scripts for your user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click **Listen live**.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local development server |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

---

## Site map

| Path | Audience | Purpose |
|------|----------|---------|
| `/` | Public | Brand hero, live player, schedule teaser, listen banner dock |
| `/schedule` | Public | Full program guide |
| `/presenters` | Public | Host roster |
| `/interact` | Public | Shoutouts, requests, poll |
| `/advertise` | Public | Packages, banner mockup, sales CTA |
| `/about` | Public | About + contact |
| `/booth` | Presenters | PIN-gated news + Interact inbox |

---

## Project structure

```
jowi_radio/
├── public/                 # Logo, PWA icons, favicon, OG image
├── src/
│   ├── config/
│   │   ├── station.ts      # Brand, stream, schedule, hosts, ad packages, PIN
│   │   ├── banners.ts      # Listen-page banner creatives
│   │   └── news.ts         # Presenter-only news bulletins
│   ├── context/
│   │   ├── AudioPlayerContext.tsx
│   │   ├── InteractionContext.tsx
│   │   ├── NewsBulletinContext.tsx
│   │   └── PresenterAuthContext.tsx
│   ├── hooks/
│   │   ├── useAudioPlayer.ts
│   │   ├── useLiveTimer.ts
│   │   ├── useListenerCount.ts   # MyRadioStream via Supabase (prod) or /api proxy (dev)
│   │   └── useShareListening.ts
│   ├── components/
│   │   ├── layout/         # Header, footer, mini-player, shell
│   │   ├── HeroPlayer.tsx
│   │   ├── AdBanner.tsx    # Dock + inline banner UI
│   │   └── …               # Playback controls, badges, etc.
│   ├── pages/              # Route screens (incl. BoothPage)
│   ├── App.tsx             # Router + providers
│   ├── main.tsx
│   └── index.css           # Tailwind + brand theme + motion
├── docs/
│   └── BOOTH.md            # Presenter host guide + daily habit
├── scripts/
│   └── verify-interact.mjs # Backend smoke check
├── supabase/
│   ├── schema.sql          # Interact + news_bulletins + RLS
│   └── functions/listeners # Stats proxy (Hobby-safe)
├── index.html
├── vite.config.ts          # React, Tailwind, PWA
└── package.json
```

---

## Stream

```
https://s23.myradiostream.com:20542/listen.mp3
```

Configured in `src/config/station.ts` as `STATION.streamUrl`. The player appends `?nocache=<timestamp>` on connect to avoid stale cached responses.

Playback persists while navigating thanks to `AudioPlayerProvider` and the sticky mini-player.

---

## Customization guide

### Station branding & content

Edit **`src/config/station.ts`**:

- Name, frequency, tagline, logo path
- Stream URL
- Current show / up next
- About blurb, email, phone, WhatsApp, social URLs
- `SCHEDULE` — program guide
- `PRESENTERS` — host cards
- `AD_PACKAGES` — Advertise page rates and perks
- `ACTIVE_POLL` — Interact poll question/options
- `presenterPin` — booth login (default `jowi981`)

### Presenter news (booth only)

Edit **`src/config/news.ts`**. These items appear only after booth login — not on public pages.

### Listen banner ads

Edit **`src/config/banners.ts`**. Each creative supports:

| Field | Purpose |
|-------|---------|
| `active` | On/off without deleting |
| `advertiser`, `headline`, `tagline`, `ctaLabel` | Copy |
| `href` | Click-through URL |
| `imageUrl` | Optional logo/product image |
| `weight` | Higher = shown more often when several ads are active |
| `startsAt` / `endsAt` | Booking window (ISO dates) |

Active, in-date banners rotate in the **dock** on `/` (above the mini-player).

### Logo & assets

- Station logo: `public/logo.png`
- PWA / OG: `public/pwa-*.png`, `public/apple-touch-icon.png`, `public/og-image.png`

---

## Advertising packages (current rate card)

Configured in `AD_PACKAGES` (KES, community-station starting points):

| Package | From |
|---------|------|
| Listen Banner | KES 15,000 / week (KES 45,000 / month) |
| Spot Ads | KES 3,000 / spot (weekly flights from KES 18,000) |
| Show Sponsorship | KES 50,000 / week |
| Full Campaign | KES 150,000 (4-week starter) |

The Advertise page includes a **mockup** of listen-page banner placement for sales conversations.

---

## Presenter booth

Full host guide: [`docs/BOOTH.md`](docs/BOOTH.md).

1. Open `/booth` (footer → “Presenter booth”)
2. Enter studio PIN (shared Supabase Auth user password = PIN — see `VITE_BOOTH_EMAIL`)
3. Use the **show strip** (on air / up next / listeners)
4. Read **News for air** (focus mode, mark used, add/edit/archive when Auth is connected)
5. Manage **Interact inbox** (filters, flag, clear) and check **live poll** totals

Session stays until Sign out or the tab session ends. Auth session also persists via Supabase.

### Booth backend checklist

```bash
# Apply schema (Interact + news_bulletins + RLS)
# → Supabase SQL Editor: supabase/schema.sql

# Prefer Supabase for listener stats (Hobby-safe for always-open tabs)
npx supabase functions deploy listeners --no-verify-jwt

npm run verify:interact
```

---

## Interact panel

Listeners submit shoutouts and song requests and vote in the live poll. Data lives in **Supabase** (`interaction_messages`, `poll_votes`) with realtime to the booth.

Requires `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` and `supabase/schema.sql`. Flag/clear need the booth Auth session (Phase 4 RLS).

---

## Known limitations / mocks

| Item | Status |
|------|--------|
| Listener count | **Live** from MyRadioStream; prod prefers Supabase Edge Function (`VITE_LISTENERS_URL` or auto from `VITE_SUPABASE_URL`); local/dev can use Vite `/api/listeners` |
| Show / track metadata | **Schedule-driven** show titles; ICY track titles empty upstream; ACR/AudD on hold |
| Interact messages | **Supabase** realtime (multi-device) |
| News bulletins | **Supabase** for booth Auth; config fallback in `src/config/news.ts` if offline |
| Banner bookings | **Config-driven**; no payment gateway yet |
| Contact / social URLs | Placeholder values — replace with real station details |
| Commercial hosting | If selling ads on the site, use Vercel Pro or another host — independent of stream listener count |

---

## Design notes

- Brand colors: charcoal atmosphere, JOWI gold accent, live red
- Listen-first home: brand and player dominate the first viewport
- Banner dock: visible without scrolling, secondary to listening
- Motion: live badge pulse, equalizer on play, fade-up on hero

---

## Deploy

```bash
npm run build
```

Serve the `dist/` folder on any static host (Netlify, Vercel, Cloudflare Pages, S3 + CDN, etc.). Ensure the host supports SPA fallback so routes like `/booth` resolve to `index.html`.

Set production env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BOOTH_EMAIL`, and preferably `VITE_LISTENERS_URL` (or rely on prod auto-derive).

HTTPS is recommended for PWA install and secure streaming contexts.

---

## License

Private project (`"private": true` in `package.json`). All rights reserved by the station unless otherwise agreed.
