# Later work (keep in mind)

Booth desk is production-usable for news, Interact, and poll. Below is what is **not** finished or still needs station input — do these when you have time.

## Content (station / marketing)

- [x] Real **About** copy (story + MD/CEO leadership block written 2026-11-06; facts from public records need owner confirmation — founded 2019 as Ratego Radio)
- [ ] **MD/CEO photo** for the About page — Mwalimu Odhiambo Makowiti (placeholder shown; drop into `public/leadership/` and set `leadership.photo` in `src/config/station.ts`)
- [x] Real **studio phone + WhatsApp** (replaced placeholders in `src/config/station.ts`)
- [ ] Confirm station **email** (`studio@jowi981.fm`) and office **location**
- [x] Real **Facebook / TikTok** URLs
- [ ] Real **YouTube / Instagram** URLs (icons hidden in the app until provided)
- [ ] **Presenter photos** — apps are **pre-wired** (2026-11-06): drop `public/presenters/<presenter-id>.jpg` (square, ~800×800, e.g. `mercyline-akinyi-ogweno.jpg`) and the photo appears on web + mobile automatically — initials show until then. Mobile picks up new photos with no OTA (loads from the site URL); still needed: official **title + bio** for Elfas Guya, Levinta Nyamigori, Linet Nyasiaya (10 official profiles received 2026-11-04). **Linda** (Jowi Tiyo mid-morning co-host) is **removed from both apps** until her official full name, title and bio arrive — re-add her in `src/config/schedule.ts` (presenter entry + `hostIds` on `weekday-jowi-tiyo`)
- [ ] Confirm **schedule** open notes in `SCHEDULE_NOTES` (Sunday gap, overnight slots, etc.)
- [ ] Archive any leftover **demo bulletins** still in the Supabase `news_bulletins` table from early setup
- [ ] Turn on real **listen banners** in `src/config/banners.ts` when advertisers book (`active: true`)

## Booth / product

- [ ] Create confirmed booth Auth user `studio@jowi981fm.com` (password = PIN) when rate limits allow — nicer signed-in session
- [ ] Tighten RLS again (news + storage + polls authenticated-only) once Auth is reliable
- [x] Poll editor in booth (publish / reset / end without redeploy)
- [ ] “Clear aired” / archive old Interact messages mid-shift
- [ ] Optional: AI extract language preference (Dholuo-first vs English-first)

## Listeners / tech (nice-to-have)

- [ ] Live **song/artist** titles (ICY empty; ACR/AudD later)
- [ ] Commercial hosting decision if selling ads on the site (Vercel Pro / other host) — independent of stream listeners
- [ ] Change studio PIN from default `jowi981` before wide staff use

## Already good enough for air

- Live stream player + mini-player  
- Schedule-driven now playing / up next  
- Booth: news CRUD, attachments, crop + AI extract, inbox, poll  
- Interact (Supabase)  
- Listener count via Supabase Edge Function  
