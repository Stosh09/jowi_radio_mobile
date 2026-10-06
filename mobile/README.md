# JOWI 98.1 FM — Android app

Native Expo / React Native app for JOWI 98.1 FM. It shares the station config (`../src/config`) and the Supabase project with the website, so schedule, presenters, banners and booth data stay in one place.

## What's in it

**Listeners**

- Live stream that keeps playing in the background, with lock-screen and notification controls, auto-reconnect (backoff + stall watchdog), and a jump back to live when the network returns
- Now playing with show progress, live listener count, up next, today's highlights
- Weekly schedule (Nairobi time) with countdowns
- Show reminders: tap the bell on any show for a weekly notification before it starts (0–30 min lead time, converted to the phone's time zone)
- Favourite shows and presenters (My JOWI), presenter profiles
- Interact: shout-outs and song requests (queued offline and sent when back online), live poll
- One-tap call, SMS, WhatsApp or email to the studio; share "I'm listening"
- Station alerts (push) opt-in, offline cache for schedule, messages, poll and news
- Settings: alerts, reminder lead time, auto-reconnect, haptics, saved name
- About, Advertise (with banner placement preview)

**Presenter booth** (More → Presenter booth, PIN)

- On-air strip with listener count
- News for air: live / drafts, "used this hour" tracking, full-screen focus reader (keeps the screen awake, adjustable text size), create / edit / archive / go live
- Attach a source: snap a press release with the camera, pick a photo, or attach PDF / Word / text. Text and .docx are read on the phone; photos and PDFs go through the `extract-bulletin` Gemini function
- Listener inbox: filter, flag for air, remove, clear all
- Poll manager: live results, reset votes, end, publish a new poll (2–6 options)
- Station alerts: send a push to every listener who opted in

## Setup

```bash
cd mobile
npm install            # .npmrc sets legacy-peer-deps (needed for EAS builds too)
cp .env.example .env   # fill in the Supabase anon / publishable key
npx expo start
```

Everything except remote push works in Expo Go. Background audio, lock-screen controls and push need a development build:

```bash
npm i -g eas-cli
eas login
eas init               # links the project and writes extra.eas.projectId into app.json (enables push)
npm run build:dev      # dev client APK, then: npx expo start --dev-client
```

Release builds:

```bash
npm run build:apk      # installable APK for testing / sideloading
npm run build:release  # Play Store app bundle (.aab)
```

Push on Android needs FCM credentials: run `eas credentials` and upload a Firebase service-account key, as described in [Expo's push setup guide](https://docs.expo.dev/push-notifications/push-notifications-setup/).

## Backend (once)

1. Run `supabase/mobile_push.sql` in the Supabase SQL Editor. It creates the push token table, the `register_push_token` RPC and the broadcast log.
2. Deploy the alert sender:
   ```bash
   supabase secrets set BOOTH_EMAIL=studio@jowi981fm.com
   supabase functions deploy send-push
   ```
   Only the signed-in booth Auth user (email = `BOOTH_EMAIL`) can send. A PIN-only booth session can manage news, inbox and polls but not attachments or alerts. See `docs/BOOTH.md`.
3. The existing `listeners` and `extract-bulletin` functions are reused as-is.

## Checks

```bash
npm run typecheck
npm run lint
npx expo-doctor
```
