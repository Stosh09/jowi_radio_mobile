// Supabase Edge Function — AI bulletin extract for JOWI booth (Luo + English)
// Secrets: supabase secrets set GEMINI_API_KEY=your_key
// Deploy:  supabase functions deploy extract-bulletin --no-verify-jwt
//
// Free Gemini API key: https://aistudio.google.com/apikey

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROMPT = `You help JOWI 98.1 FM, a Luo (Dholuo) community radio station in Kenya.
A presenter will read this on air. Extract usable bulletin copy from the attached image or document page.

Rules:
1. Prefer the MAIN news story or document content. Ignore ads, betting promos, barcodes, racing pullouts, page furniture, and unrelated side stories unless they are clearly the focus.
2. Preserve Dholuo (Luo) and English exactly as written — do not translate unless the source is unreadable; then note uncertainty briefly.
3. Fix obvious OCR-style garble only when you can clearly see the intended words.
4. Rewrite lightly into short spoken paragraphs a presenter can read (natural radio voice). Keep facts: names, places, amounts, dates, times.
5. If the page is a busy newspaper, pick ONE primary story (largest headline / clearest article).
6. If almost nothing is readable, say so in body and keep body short.

Return ONLY valid JSON (no markdown fences):
{
  "headline": "short on-air headline",
  "summary": "one sentence",
  "body": "2–6 short paragraphs for the presenter to read aloud",
  "language": "dholuo" | "english" | "mixed" | "other",
  "confidence": "high" | "medium" | "low"
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'missing_gemini_key',
        message: 'Set GEMINI_API_KEY with: supabase secrets set GEMINI_API_KEY=...',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const payload = await req.json()
    const imageBase64 = String(payload.imageBase64 ?? '').replace(/^data:[^;]+;base64,/, '')
    const mimeType = String(payload.mimeType ?? 'image/jpeg')

    if (!imageBase64 || imageBase64.length < 32) {
      return new Response(JSON.stringify({ error: 'missing_image' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cap payload size (~4MB binary)
    if (imageBase64.length > 5_500_000) {
      return new Response(JSON.stringify({ error: 'image_too_large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return new Response(
        JSON.stringify({ error: 'gemini_failed', status: upstream.status, detail: errText.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const gemini = await upstream.json()
    const raw =
      gemini?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ??
      ''

    let parsed: {
      headline?: string
      summary?: string
      body?: string
      language?: string
      confidence?: string
    }
    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) {
        return new Response(JSON.stringify({ error: 'bad_model_json', raw: raw.slice(0, 400) }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      parsed = JSON.parse(match[0])
    }

    const body = String(parsed.body ?? '').trim()
    if (!body) {
      return new Response(JSON.stringify({ error: 'empty_body' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        headline: String(parsed.headline ?? '').trim().slice(0, 160),
        summary: String(parsed.summary ?? '').trim().slice(0, 280),
        body: body.slice(0, 12000),
        language: parsed.language ?? 'mixed',
        confidence: parsed.confidence ?? 'medium',
        engine: 'gemini',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'extract_failed', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
