import { File as FsFile } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import JSZip from 'jszip'
import { NEWS_ATTACHMENT_MAX_BYTES } from '@shared/news'
import { anonHeaders, EXTRACT_URL } from './env'

/** A file picked on the phone (document picker or camera / gallery). */
export interface PickedAttachment {
  uri: string
  name: string
  mimeType: string
  size: number | null
  width?: number
  height?: number
}

const MAX_EXTRACT_CHARS = 12_000
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp']

export const ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
]

const ext = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

export function isImage(file: PickedAttachment) {
  return file.mimeType.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)
}
const isPdf = (f: PickedAttachment) => f.mimeType === 'application/pdf' || ext(f.name) === 'pdf'
const isDocx = (f: PickedAttachment) =>
  f.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
  ext(f.name) === 'docx'
const isText = (f: PickedAttachment) => f.mimeType === 'text/plain' || ext(f.name) === 'txt'
const isLegacyDoc = (f: PickedAttachment) => f.mimeType === 'application/msword' || ext(f.name) === 'doc'

export function validateAttachment(file: PickedAttachment): string | null {
  if (file.size != null && file.size > NEWS_ATTACHMENT_MAX_BYTES) return 'File must be 10 MB or smaller.'
  if (ATTACHMENT_MIME_TYPES.includes(file.mimeType) || ALLOWED_EXT.includes(ext(file.name))) return null
  return 'Use PDF, Word, text, or image files only.'
}

function tidy(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, MAX_EXTRACT_CHARS)
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
}

/** Pull paragraphs out of word/document.xml — enough for on-air copy without a full DOCX parser. */
async function extractDocx(file: PickedAttachment): Promise<string> {
  const bytes = await new FsFile(file.uri).bytes()
  const zip = await JSZip.loadAsync(bytes)
  const xml = await zip.file('word/document.xml')?.async('string')
  if (!xml) return ''
  const paragraphs = xml.split(/<\/w:p>/).map((p) => {
    const runs = p
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br\/>/g, '\n')
      .match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>|\t|\n/g)
    if (!runs) return ''
    return runs.map((r) => (r === '\t' || r === '\n' ? r : r.replace(/<[^>]+>/g, ''))).join('')
  })
  return tidy(decodeXmlEntities(paragraphs.filter((p) => p.trim()).join('\n\n')))
}

/** Shrink photos for faster / cheaper vision calls while keeping print readable. */
async function imageAsBase64(file: PickedAttachment, maxEdge = 1600) {
  const longest = Math.max(file.width ?? 0, file.height ?? 0)
  let context = ImageManipulator.manipulate(file.uri)
  if (longest > maxEdge) {
    context = context.resize(
      (file.width ?? 0) >= (file.height ?? 0) ? { width: maxEdge } : { height: maxEdge },
    )
  }
  const ref = await context.renderAsync()
  const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true })
  return { base64: saved.base64 ?? '', mimeType: 'image/jpeg' }
}

interface AiResult {
  headline: string
  summary: string
  body: string
  language?: string
  confidence?: string
}

async function aiExtract(
  base64: string,
  mimeType: string,
): Promise<{ ok: true; data: AiResult } | { ok: false; message: string }> {
  if (!EXTRACT_URL) return { ok: false, message: 'AI extract needs the Supabase connection.' }
  try {
    const res = await fetch(EXTRACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...anonHeaders() },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    })
    const json = (await res.json()) as Record<string, unknown>
    if (res.status === 503 || json.error === 'missing_gemini_key') {
      return { ok: false, message: 'AI extract needs GEMINI_API_KEY set on Supabase (see docs/BOOTH.md).' }
    }
    if (res.status === 413 || json.error === 'image_too_large') {
      return { ok: false, message: 'That file is too large for AI extract. Crop it or use a smaller PDF.' }
    }
    if (!res.ok) return { ok: false, message: String(json.message ?? json.error ?? `AI extract failed (${res.status})`) }
    const body = String(json.body ?? '').trim()
    if (!body) return { ok: false, message: 'AI returned no readable bulletin text.' }
    return {
      ok: true,
      data: {
        headline: String(json.headline ?? ''),
        summary: String(json.summary ?? ''),
        body,
        language: String(json.language ?? ''),
        confidence: String(json.confidence ?? ''),
      },
    }
  } catch {
    return { ok: false, message: 'Could not reach the AI extract service. Check the connection.' }
  }
}

function aiNote(data: AiResult) {
  if (data.confidence === 'low') return 'AI was unsure — check Luo spellings and names before air.'
  if (data.language === 'dholuo' || data.language === 'mixed') {
    return 'Extracted with AI (Luo/English preserved). Edit for a natural on-air read.'
  }
  return 'Extracted with AI for on-air reading. Edit if needed.'
}

export type ExtractResult =
  | { ok: true; text: string; headline?: string; summary?: string; warning?: string; engine: 'gemini' | 'local' }
  | { ok: false; message: string }

/**
 * Pull readable bulletin copy from an attachment.
 * Text and DOCX are parsed on the phone; photos and PDFs go to Gemini via the Edge Function.
 */
export async function extractAttachmentText(file: PickedAttachment): Promise<ExtractResult> {
  try {
    if (isText(file)) {
      const text = tidy(await new FsFile(file.uri).text())
      return text ? { ok: true, text, engine: 'local' } : { ok: false, message: 'That text file looks empty.' }
    }
    if (isDocx(file)) {
      const text = await extractDocx(file)
      return text ? { ok: true, text, engine: 'local' } : { ok: false, message: 'No text found in that Word file.' }
    }
    if (isLegacyDoc(file)) {
      return { ok: false, message: 'Old .doc files are not supported — save as .docx or PDF, or paste the text.' }
    }
    if (isPdf(file) || isImage(file)) {
      const payload = isPdf(file)
        ? { base64: await new FsFile(file.uri).base64(), mimeType: 'application/pdf' }
        : await imageAsBase64(file)
      const ai = await aiExtract(payload.base64, payload.mimeType)
      if (!ai.ok) return { ok: false, message: `${ai.message} You can still paste the on-air body.` }
      return {
        ok: true,
        text: ai.data.body,
        headline: ai.data.headline,
        summary: ai.data.summary,
        warning: aiNote(ai.data),
        engine: 'gemini',
      }
    }
    return { ok: false, message: 'Unsupported file for text extraction.' }
  } catch (err) {
    console.warn('Attachment extract failed', err)
    return { ok: false, message: 'Could not read that file. You can still paste the on-air body manually.' }
  }
}

export async function readAttachmentBytes(file: PickedAttachment): Promise<Uint8Array> {
  return new FsFile(file.uri).bytes()
}
