import type { PDFDocumentProxy } from 'pdfjs-dist'

const MAX_EXTRACT_CHARS = 12_000
const MIN_WORD_CONFIDENCE = 45
const MIN_LETTER_RATIO = 0.52

function tidyExtracted(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, MAX_EXTRACT_CHARS)
}

/** Drop OCR junk lines (common on busy newspaper pages). */
function cleanOcrLines(text: string): string {
  const lines = text.split(/\n/)
  const kept: string[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (line.length < 3) continue

    const compact = line.replace(/\s+/g, '')
    const letters = (compact.match(/[A-Za-z]/g) ?? []).length
    const digits = (compact.match(/\d/g) ?? []).length
    const letterRatio = letters / Math.max(compact.length, 1)

    // Skip barcode / promo noise / symbol soup
    if (letterRatio < MIN_LETTER_RATIO && digits / Math.max(compact.length, 1) < 0.4) continue
    if (/^[\W\d_|\\/=+\-<>\[\]{}]+$/i.test(compact)) continue
    if ((line.match(/[|\\\/_]{2,}/g) ?? []).length >= 2) continue
    if (/FREE\s*£?\s*\d+\s*SHOP\s*BET/i.test(line)) continue
    if (/Terms\s*&\s*conditions/i.test(line) && line.length < 80) continue

    kept.push(line)
  }

  return tidyExtracted(kept.join('\n'))
}

function letterRatio(text: string): number {
  const compact = text.replace(/\s+/g, '')
  if (!compact) return 0
  return (compact.match(/[A-Za-z]/g) ?? []).length / compact.length
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default

  const data = new Uint8Array(await file.arrayBuffer())
  const pdf: PDFDocumentProxy = await pdfjs.getDocument({ data }).promise
  const parts: string[] = []
  const pageLimit = Math.min(pdf.numPages, 20)
  for (let i = 1; i <= pageLimit; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    if (line.trim()) parts.push(line)
  }
  return tidyExtracted(parts.join('\n\n'))
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return tidyExtracted(result.value ?? '')
}

/** Upscale + grayscale + contrast so OCR sees print more clearly. */
async function preprocessForOcr(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const targetW = Math.max(bitmap.width, 1600)
  const scale = targetW / bitmap.width
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const image = ctx.getImageData(0, 0, w, h)
  const d = image.data
  const contrast = 1.35
  const intercept = 128 * (1 - contrast)

  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    const boosted = Math.max(0, Math.min(255, gray * contrast + intercept))
    // Soft threshold helps white-on-dark headline bars
    const out = boosted > 185 ? 255 : boosted < 70 ? 0 : boosted
    d[i] = d[i + 1] = d[i + 2] = out
  }

  ctx.putImageData(image, 0, 0)
  return canvas
}

type OcrPass = { text: string; meanConfidence: number }

function scoreOcrPass(
  words: { text: string; confidence: number }[] | undefined,
  rawText: string,
): OcrPass {
  const cleaned = cleanOcrLines(rawText)
  if (!words?.length) {
    return { text: cleaned, meanConfidence: cleaned ? 40 : 0 }
  }

  const kept = words.filter(
    (w) => w.confidence >= MIN_WORD_CONFIDENCE && w.text.trim().length > 0,
  )
  const mean = kept.length
    ? kept.reduce((sum, w) => sum + w.confidence, 0) / kept.length
    : 0

  return { text: cleaned, meanConfidence: mean }
}

async function extractImage(file: File): Promise<{ text: string; warning?: string }> {
  const canvas = await preprocessForOcr(file)
  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await createWorker('eng')

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
    })

    const w = canvas.width
    const h = canvas.height
    const top = Math.floor(h * 0.06)
    const usableH = Math.floor(h * 0.78)

    // Busy newspaper pages: OCR main column + sidebar separately (not whole page).
    const regions =
      w >= 900
        ? [
            {
              label: 'main',
              rectangle: {
                left: 0,
                top,
                width: Math.floor(w * 0.6),
                height: usableH,
              },
            },
            {
              label: 'side',
              rectangle: {
                left: Math.floor(w * 0.55),
                top,
                width: Math.floor(w * 0.45),
                height: usableH,
              },
            },
          ]
        : [
            {
              label: 'full',
              rectangle: { left: 0, top: 0, width: w, height: h },
            },
          ]

    const chunks: string[] = []
    let confidenceSum = 0
    let passes = 0

    for (const region of regions) {
      const result = await worker.recognize(canvas, {
        rectangle: region.rectangle,
      })
      const data = result.data as {
        text?: string
        words?: { text: string; confidence: number }[]
      }
      const pass = scoreOcrPass(data.words, data.text ?? '')
      const cleaned = pass.text
      if (cleaned) {
        chunks.push(cleaned)
        confidenceSum += pass.meanConfidence
        passes += 1
      }
    }

    // If columns failed, one more pass on the full preprocessed page
    if (!chunks.length) {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: '1',
      })
      const result = await worker.recognize(canvas)
      const data = result.data as {
        text?: string
        words?: { text: string; confidence: number }[]
      }
      const pass = scoreOcrPass(data.words, data.text ?? '')
      const cleaned = pass.text
      if (cleaned) {
        chunks.push(cleaned)
        confidenceSum += pass.meanConfidence
        passes += 1
      }
    }

    const text = tidyExtracted(chunks.join('\n\n'))
    if (!text) {
      return { text: '' }
    }

    const meanConf = passes ? confidenceSum / passes : 0
    const ratio = letterRatio(text)
    const weak = meanConf < 55 || ratio < 0.62

    return {
      text,
      warning: weak
        ? 'This looks like a busy newspaper page — OCR is approximate. Crop to one article (or paste the story) for a cleaner on-air read.'
        : undefined,
    }
  } finally {
    await worker.terminate()
  }
}

function isImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return /\.(png|jpe?g|webp)$/i.test(file.name)
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

function isDocx(file: File): boolean {
  return (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    /\.docx$/i.test(file.name)
  )
}

function isPlainText(file: File): boolean {
  return file.type === 'text/plain' || /\.txt$/i.test(file.name)
}

function isLegacyDoc(file: File): boolean {
  return file.type === 'application/msword' || /\.doc$/i.test(file.name)
}

export type ExtractResult =
  | {
      ok: true
      text: string
      headline?: string
      summary?: string
      warning?: string
      engine?: 'gemini' | 'local'
    }
  | { ok: false; message: string }

/**
 * Pull readable bulletin copy from an attachment.
 * Photos: AI Vision (Gemini via Edge Function) first — far better for Luo/English notices & papers.
 * Falls back to local OCR if AI is not configured.
 * Text PDFs / DOCX / TXT are parsed directly.
 */
export async function extractNewsAttachmentText(file: File): Promise<ExtractResult> {
  try {
    if (isPlainText(file)) {
      const text = tidyExtracted(await file.text())
      if (!text) return { ok: false, message: 'That text file looks empty.' }
      return { ok: true, text, engine: 'local' }
    }

    if (isPdf(file)) {
      const text = await extractPdf(file)
      if (text) return { ok: true, text, engine: 'local' }

      // Scanned PDF: render first page → AI if available
      try {
        const pdfjs = await import('pdfjs-dist')
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default
        const data = new Uint8Array(await file.arrayBuffer())
        const pdf = await pdfjs.getDocument({ data }).promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          await page.render({ canvas, canvasContext: ctx, viewport }).promise
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', 0.9),
          )
          if (blob) {
            const imageFile = new File([blob], 'scan.jpg', { type: 'image/jpeg' })
            return extractNewsAttachmentText(imageFile)
          }
        }
      } catch (err) {
        console.warn('PDF page render failed', err)
      }

      return {
        ok: false,
        message:
          'No text found in that PDF. Crop a photo of one page/story, or paste the copy.',
      }
    }

    if (isDocx(file)) {
      const text = await extractDocx(file)
      if (!text) return { ok: false, message: 'No text found in that Word file.' }
      return { ok: true, text, engine: 'local' }
    }

    if (isLegacyDoc(file)) {
      return {
        ok: false,
        message: 'Old .doc files are not supported — save as .docx or PDF, or paste the text.',
      }
    }

    if (isImage(file)) {
      const { extractBulletinWithAi } = await import('./aiBulletinExtract')
      const ai = await extractBulletinWithAi(file)
      if (ai.ok) {
        const note =
          ai.data.confidence === 'low'
            ? 'AI was unsure — check Luo spellings and names before air.'
            : ai.data.language === 'dholuo' || ai.data.language === 'mixed'
              ? 'Extracted with AI (Luo/English preserved). Edit for a natural on-air read.'
              : 'Extracted with AI for on-air reading. Edit if needed.'
        return {
          ok: true,
          text: ai.data.body,
          headline: ai.data.headline,
          summary: ai.data.summary,
          warning: note,
          engine: 'gemini',
        }
      }

      // Fallback: local OCR (weaker — used when Gemini is not deployed)
      const { text, warning } = await extractImage(file)
      if (!text) {
        return {
          ok: false,
          message: ai.missingKey
            ? `${ai.message} Meanwhile crop one story clearly, or paste the text.`
            : 'Could not read that image. Crop to a single story or paste the copy.',
        }
      }
      return {
        ok: true,
        text,
        warning: `${ai.message} Using weaker local OCR for now. ${warning ?? ''}`.trim(),
        engine: 'local',
      }
    }

    return { ok: false, message: 'Unsupported file for text extraction.' }
  } catch (err) {
    console.error('Attachment extract failed', err)
    return {
      ok: false,
      message: 'Could not read that file. You can still paste the on-air body manually.',
    }
  }
}
