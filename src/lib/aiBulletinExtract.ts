import { isSupabaseConfigured } from './supabase'

export interface AiExtractResult {
  headline: string
  summary: string
  body: string
  language?: string
  confidence?: string
  engine: 'gemini'
}

function extractUrl(): string | null {
  const configured = import.meta.env.VITE_EXTRACT_URL as string | undefined
  if (configured?.trim()) return configured.trim()
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!base || base.includes('YOUR_PROJECT_REF')) return null
  return `${base.replace(/\/$/, '')}/functions/v1/extract-bulletin`
}

/** Shrink photo for faster/cheaper vision calls while keeping text readable. */
export async function fileToInlineImage(
  file: File,
  maxEdge = 1600,
): Promise<{ base64: string; mimeType: string }> {
  if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp') {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas unavailable')
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('encode failed'))),
        mimeType,
        0.85,
      )
    })
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
    return { base64: btoa(binary), mimeType }
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return { base64: btoa(binary), mimeType: file.type || 'application/octet-stream' }
}

/**
 * AI extract via Supabase Edge Function (Gemini).
 * Much stronger than in-browser Tesseract for photos / newspaper pages / Luo text.
 */
export async function extractBulletinWithAi(file: File): Promise<
  | { ok: true; data: AiExtractResult }
  | { ok: false; message: string; missingKey?: boolean }
> {
  const url = extractUrl()
  if (!url || !isSupabaseConfigured) {
    return {
      ok: false,
      message: 'AI extract is not configured (need VITE_SUPABASE_URL).',
      missingKey: true,
    }
  }

  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  try {
    const { base64, mimeType } = await fileToInlineImage(file)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anon
          ? {
              Authorization: `Bearer ${anon}`,
              apikey: anon,
            }
          : {}),
      },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    })

    const json = (await res.json()) as Record<string, unknown>
    if (res.status === 503 || json.error === 'missing_gemini_key') {
      return {
        ok: false,
        missingKey: true,
        message:
          'AI extract needs GEMINI_API_KEY on Supabase. Get a free key at aistudio.google.com/apikey, then: supabase secrets set GEMINI_API_KEY=... && supabase functions deploy extract-bulletin --no-verify-jwt',
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        message: String(json.message ?? json.error ?? `AI extract failed (${res.status})`),
      }
    }

    const body = String(json.body ?? '').trim()
    if (!body) {
      return { ok: false, message: 'AI returned no readable bulletin text.' }
    }

    return {
      ok: true,
      data: {
        headline: String(json.headline ?? ''),
        summary: String(json.summary ?? ''),
        body,
        language: String(json.language ?? ''),
        confidence: String(json.confidence ?? ''),
        engine: 'gemini',
      },
    }
  } catch (err) {
    console.error('AI extract failed', err)
    return { ok: false, message: 'Could not reach AI extract service.' }
  }
}
