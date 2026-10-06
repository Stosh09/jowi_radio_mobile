// Supabase Edge Function — live listener count proxy
// Deploy: supabase functions deploy listeners --no-verify-jwt
// Then set in .env:
// VITE_LISTENERS_URL=https://auawjenbkghmnlhknfmy.supabase.co/functions/v1/listeners

const STREAM_STATS = 'https://s23.myradiostream.com:20542/stats?json=1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const upstream = await fetch(STREAM_STATS, {
      headers: { Accept: 'application/json' },
    })

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: 'upstream_failed', status: upstream.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await upstream.json()
    const body = {
      currentlisteners: data.currentlisteners ?? 0,
      uniquelisteners: data.uniquelisteners ?? 0,
      peaklisteners: data.peaklisteners ?? 0,
      bitrate: data.bitrate ?? null,
      streamstatus: data.streamstatus ?? 0,
    }

    return new Response(JSON.stringify(body), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'fetch_failed', message: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
