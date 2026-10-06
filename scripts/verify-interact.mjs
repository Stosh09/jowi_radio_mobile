#!/usr/bin/env node
/**
 * Phase 2 smoke check — Interact + listeners backend readiness.
 * Usage: node --env-file=.env scripts/verify-interact.mjs
 * (or ensure VITE_SUPABASE_* are in the environment)
 */

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
const listenersUrl =
  process.env.VITE_LISTENERS_URL ||
  (url ? `${url.replace(/\/$/, '')}/functions/v1/listeners` : null)

function fail(msg) {
  console.error(`FAIL: ${msg}`)
  process.exitCode = 1
}

function ok(msg) {
  console.log(`OK: ${msg}`)
}

async function main() {
  if (!url || !key || url.includes('YOUR_PROJECT_REF')) {
    fail('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
    return
  }

  ok(`Supabase URL ${url}`)

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  // Messages readable
  {
    const res = await fetch(
      `${url}/rest/v1/interaction_messages?select=id&limit=1`,
      { headers },
    )
    if (!res.ok) fail(`interaction_messages select → ${res.status} ${await res.text()}`)
    else ok('interaction_messages readable')
  }

  // Insert + delete a probe shoutout (delete needs Auth under Phase 4 RLS —
  // anon insert should still work)
  const probeBody = {
    kind: 'shoutout',
    name: 'verify-script',
    body: `probe ${new Date().toISOString()}`,
  }
  {
    const res = await fetch(`${url}/rest/v1/interaction_messages`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(probeBody),
    })
    if (!res.ok) fail(`shoutout insert → ${res.status} ${await res.text()}`)
    else {
      const rows = await res.json()
      ok(`shoutout insert id=${rows[0]?.id ?? '?'}`)
      if (rows[0]?.id) {
        const del = await fetch(
          `${url}/rest/v1/interaction_messages?id=eq.${rows[0].id}`,
          { method: 'DELETE', headers },
        )
        if (del.ok) ok('probe message deleted (anon delete still allowed)')
        else
          ok(
            `probe left in inbox (delete requires booth Auth — expected after Phase 4): ${del.status}`,
          )
      }
    }
  }

  // Polls
  {
    const res = await fetch(`${url}/rest/v1/polls?select=id,question&limit=5`, {
      headers,
    })
    if (!res.ok) fail(`polls select → ${res.status}`)
    else ok('polls readable')
  }

  // News table exists (select as anon should fail after Phase 4 — that is OK)
  {
    const res = await fetch(
      `${url}/rest/v1/news_bulletins?select=id&limit=1`,
      { headers },
    )
    if (res.status === 401 || res.status === 403) {
      ok('news_bulletins blocked for anon (Phase 4 RLS)')
    } else if (res.ok) {
      ok('news_bulletins readable as anon (run latest schema.sql to harden)')
    } else if (res.status === 404) {
      fail('news_bulletins missing — run supabase/schema.sql')
    } else {
      fail(`news_bulletins → ${res.status} ${await res.text()}`)
    }
  }

  // Listeners edge function
  if (listenersUrl) {
    const res = await fetch(listenersUrl, {
      headers: { Authorization: `Bearer ${key}`, apikey: key },
    })
    if (!res.ok) {
      fail(
        `listeners function → ${res.status}. Deploy with: npx supabase functions deploy listeners --no-verify-jwt`,
      )
    } else {
      const data = await res.json()
      ok(`listeners current=${data.currentlisteners ?? '?'}`)
    }
  } else {
    fail('No listeners URL configured')
  }

  if (process.exitCode) {
    console.error('\nInteract verification finished with failures.')
  } else {
    console.log('\nInteract verification passed.')
  }
}

main().catch((err) => {
  fail(String(err))
})
