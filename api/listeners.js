const STREAM_STATS = 'https://s23.myradiostream.com:20542/stats?json=1'

export const config = {
  runtime: 'edge',
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

/** Proxies MyRadioStream stats — browsers cannot call Shoutcast directly (no CORS). */
export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  try {
    const upstream = await fetch(STREAM_STATS, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: 'upstream_failed', status: upstream.status }),
        { status: 502, headers: corsHeaders() },
      )
    }

    const data = await upstream.json()

    return new Response(
      JSON.stringify({
        currentlisteners: data.currentlisteners ?? 0,
        uniquelisteners: data.uniquelisteners ?? 0,
        peaklisteners: data.peaklisteners ?? 0,
        bitrate: data.bitrate ?? null,
        streamstatus: data.streamstatus ?? 0,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'fetch_failed', message: String(error) }),
      { status: 500, headers: corsHeaders() },
    )
  }
}
