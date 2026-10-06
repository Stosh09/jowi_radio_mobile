# Later work (keep in mind)

Booth desk is production-usable for news, Interact, and poll. Below is what is **not** finished or still needs station input — do these when you have time.

## Content (station / marketing)

- [ ] Real **About** copy (more than the short blurb)
- [ ] Real **email, phone, WhatsApp** (replace placeholders in `src/config/station.ts`)
- [ ] Real **Facebook / TikTok / YouTube / Instagram** URLs
- [ ] **Presenter photos** + bios written by the station
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
