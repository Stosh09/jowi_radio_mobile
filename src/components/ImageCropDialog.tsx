import { useEffect, useRef, useState, type PointerEvent } from 'react'

interface Props {
  file: File
  onCancel: () => void
  /** Called with original or cropped image ready for extract */
  onConfirm: (file: File) => void
}

/**
 * Simple drag-to-crop for newspaper / notice photos.
 * Presenters should frame ONE story before AI extract.
 */
export function ImageCropDialog({ file, onCancel, onConfirm }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [url, setUrl] = useState('')
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(
    null,
  )
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(
    null,
  )

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const clientToLocal = (clientX: number, clientY: number) => {
    const img = imgRef.current
    if (!img) return { x: 0, y: 0 }
    const rect = img.getBoundingClientRect()
    return {
      x: Math.min(Math.max(clientX - rect.left, 0), rect.width),
      y: Math.min(Math.max(clientY - rect.top, 0), rect.height),
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLImageElement>) => {
    const p = clientToLocal(e.clientX, e.clientY)
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLImageElement>) => {
    if (!drag) return
    const p = clientToLocal(e.clientX, e.clientY)
    setDrag({ ...drag, x1: p.x, y1: p.y })
  }

  const onPointerUp = () => {
    if (!drag) return
    const left = Math.min(drag.x0, drag.x1)
    const top = Math.min(drag.y0, drag.y1)
    const width = Math.abs(drag.x1 - drag.x0)
    const height = Math.abs(drag.y1 - drag.y0)
    setDrag(null)
    if (width < 24 || height < 24) {
      setBox(null)
      return
    }
    setBox({ left, top, width, height })
  }

  const selection = drag
    ? {
        left: Math.min(drag.x0, drag.x1),
        top: Math.min(drag.y0, drag.y1),
        width: Math.abs(drag.x1 - drag.x0),
        height: Math.abs(drag.y1 - drag.y0),
      }
    : box

  const exportCrop = async () => {
    const img = imgRef.current
    if (!img) return

    if (!box) {
      onConfirm(file)
      return
    }

    const scaleX = img.naturalWidth / img.clientWidth
    const scaleY = img.naturalHeight / img.clientHeight
    const sx = Math.round(box.left * scaleX)
    const sy = Math.round(box.top * scaleY)
    const sw = Math.round(box.width * scaleX)
    const sh = Math.round(box.height * scaleY)

    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      onConfirm(file)
      return
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92),
    )
    if (!blob) {
      onConfirm(file)
      return
    }
    const cropped = new File([blob], file.name.replace(/(\.\w+)?$/, '-crop.jpg'), {
      type: 'image/jpeg',
    })
    onConfirm(cropped)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-jowi-gold/30 bg-jowi-bg">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="font-display text-lg uppercase text-white">Crop to one story</p>
          <p className="mt-1 text-sm text-jowi-muted">
            Drag a box around the article or notice you want on air (Luo or English). Skip crop only
            if the photo is already a single document.
          </p>
        </div>
        <div className="relative min-h-0 flex-1 overflow-auto bg-black/40 p-3">
          {url && (
            <div className="relative inline-block max-w-full touch-none">
              <img
                ref={imgRef}
                src={url}
                alt="Bulletin source"
                className="max-h-[60vh] max-w-full select-none"
                draggable={false}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              />
              {selection && selection.width > 0 && (
                <div
                  className="pointer-events-none absolute border-2 border-jowi-gold bg-jowi-gold/10"
                  style={{
                    left: selection.left,
                    top: selection.top,
                    width: selection.width,
                    height: selection.height,
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => void exportCrop()}
            className="rounded-md bg-jowi-gold px-4 py-2 text-sm font-bold uppercase tracking-wide text-black"
          >
            {box ? 'Extract cropped story' : 'Extract full image'}
          </button>
          <button
            type="button"
            onClick={() => setBox(null)}
            className="rounded-md border border-white/20 px-4 py-2 text-sm text-jowi-muted hover:text-white"
          >
            Clear crop
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-white/20 px-4 py-2 text-sm text-jowi-muted hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
