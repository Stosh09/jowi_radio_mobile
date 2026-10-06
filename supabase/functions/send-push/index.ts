// Supabase Edge Function — station alerts from the booth to the JOWI mobile app.
// Requires: supabase/mobile_push.sql
// Secrets:  supabase secrets set BOOTH_EMAIL=studio@jowi981fm.com
// Deploy:   supabase functions deploy send-push
//
// Only the signed-in booth Auth user (email === BOOTH_EMAIL) may send.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const CHUNK = 100
const ALLOWED_URLS = new Set(['/', '/interact', '/schedule'])

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface ExpoTicket {
  status: 'ok' | 'error'
  message?: string
  details?: { error?: string }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const boothEmail = (Deno.env.get('BOOTH_EMAIL') ?? 'studio@jowi981fm.com').toLowerCase()
  if (!supabaseUrl || !anonKey || !serviceKey) return json(500, { error: 'missing_env' })

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json(401, { error: 'unauthorized', message: 'Sign in as the booth user.' })
  if ((userData.user.email ?? '').toLowerCase() !== boothEmail) {
    return json(403, { error: 'forbidden', message: 'Only the booth account can send station alerts.' })
  }

  let payload: { title?: unknown; body?: unknown; url?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  const title = String(payload.title ?? '').trim().slice(0, 65)
  const body = String(payload.body ?? '').trim().slice(0, 178)
  const url = typeof payload.url === 'string' && ALLOWED_URLS.has(payload.url) ? payload.url : '/'
  if (!title || !body) return json(400, { error: 'missing_fields', message: 'Add a title and a message.' })

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: rows, error: tokenError } = await admin.from('push_tokens').select('token').eq('enabled', true)
  if (tokenError) return json(500, { error: 'tokens_unavailable', message: tokenError.message })
  const tokens = (rows ?? []).map((r: { token: string }) => r.token)

  let sent = 0
  let failed = 0
  const dead: string[] = []

  for (let i = 0; i < tokens.length; i += CHUNK) {
    const batch = tokens.slice(i, i + CHUNK)
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        batch.map((to: string) => ({
          to,
          title,
          body,
          sound: 'default',
          channelId: 'broadcasts',
          priority: 'high',
          data: { url, kind: 'broadcast' },
        })),
      ),
    })
    if (!res.ok) {
      failed += batch.length
      continue
    }
    const { data: tickets } = (await res.json()) as { data?: ExpoTicket[] }
    ;(tickets ?? []).forEach((ticket, idx) => {
      if (ticket.status === 'ok') {
        sent += 1
      } else {
        failed += 1
        if (ticket.details?.error === 'DeviceNotRegistered') dead.push(batch[idx])
      }
    })
  }

  if (dead.length) await admin.from('push_tokens').delete().in('token', dead)

  await admin.from('push_broadcasts').insert({
    title,
    body,
    url,
    sent_count: sent,
    sent_by: userData.user.email,
  })

  return json(200, { sent, failed, removed: dead.length })
})
