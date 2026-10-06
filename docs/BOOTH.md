# Presenter booth — host guide

Staff desk at `/booth`. Listeners never see news bulletins on the public site.

## Sign in

1. Open `/booth` (footer → Presenter booth).
2. Enter the **studio PIN**.
3. Prefer the shared Supabase Auth user (`VITE_BOOTH_EMAIL`, password = PIN) so news CRUD and inbox flag/clear work under RLS. Until that user exists, run `supabase/interact_anon_moderation.sql`, `supabase/poll_booth_editor.sql`, and the news anon scripts so PIN-only booth can Flag / Clear / manage polls.
4. Sign out at end of shift on shared PCs.

Create the booth user once: Supabase → Authentication → Users → Add user  
Email: value of `VITE_BOOTH_EMAIL` (default `studio@jowi981fm.com` — avoid `.fm`, Supabase rejects it)  
Password: same as `presenterPin` in `src/config/station.ts`

## On-air checklist

1. Confirm **Show strip**: current show, up next, listener count.
2. Mini-player still works — confirm stream audio.
3. **News for air**
   - Breaking items first
   - Open **Focus read** at the mic
   - **Mark used** after you read (resets each clock hour)
   - Optional **document** on a bulletin: Open from the list or Focus (source PDF/Word/image — body stays the spoken script)
4. **Interact inbox**
   - Filter All / Flagged / Requests / Shoutouts
   - **Flag for air** → read → Unflag
   - **Clear all** at end of shift if desired
5. **Live poll** — publish a question from the booth; it appears on `/interact`. Use **Reset votes** for a fresh 0%, or **End poll** to hide it.

## Producer habit (daily)

- Before first shift: add **3–6 live bulletins** (Add bulletin).
- Use **Draft** for copy still being checked; **Go live** when ready.
- **Archive** expired stories instead of deleting (keeps history).
- Flash/Breaking: category Breaking (auto priority).
- Attach a photo/PDF of a notice: **crop to one story**, then AI extracts Luo/English into the on-air body.
  Requires Gemini Edge Function (`extract-bulletin`) — see Backend setup.

## Backend setup (once)

1. Copy `.env.example` → `.env` and fill Supabase URL + anon/publishable key.
2. Run `supabase/schema.sql` in the SQL Editor.
3. If the project already had news tables, also run `supabase/news_attachments.sql` (attachment columns + `booth-news` Storage bucket).
4. Deploy AI bulletin extract (photos → on-air Luo/English copy):

```bash
# Free key: https://aistudio.google.com/apikey
npx supabase secrets set GEMINI_API_KEY=your_key_here
npx supabase functions deploy extract-bulletin --no-verify-jwt
```

5. Deploy listeners function (keeps open-tab polling off Vercel Hobby):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy listeners --no-verify-jwt
```

6. Set `VITE_LISTENERS_URL` (or rely on production auto-derive from `VITE_SUPABASE_URL`).
7. Smoke check:

```bash
npm run verify:interact
```

## Hosting notes

| What grows | Hits Vercel? | Action |
|------------|--------------|--------|
| More people streaming radio | No (MyRadioStream) | Watch stream plan |
| Many website tabs left open | Polling listeners | Use Supabase Edge Function |
| Selling ads / commercial site | Policy | Vercel Pro or another host — independent of listener count |

## Rules of the booth

- Do not read phone numbers or home addresses on air.
- Paraphrase personal shoutouts when needed.
- News stays booth-only — never copy onto public pages unless marketing asks separately.
