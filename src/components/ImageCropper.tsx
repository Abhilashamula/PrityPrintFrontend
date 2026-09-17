import { useEffect, useRef, useState } from 'react'
import { Check, Crop, Maximize2, RotateCcw } from 'lucide-react'

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

type Handle = 'move' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
type AspectPreset = 'free' | 'square' | '4:3' | '16:9' | 'A4' | 'A6'

interface Interaction {
  handle: Handle
  startX: number
  startY: number
  crop: CropArea
}

interface ImageCropperProps {
  file: File
  previewUrl: string
  onApply: (file: File, previewUrl: string) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function ImageCropper({ file, previewUrl, onApply }: ImageCropperProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const interactionRef = useRef<Interaction | null>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 })
  const [isApplying, setIsApplying] = useState(false)

  const getFullCrop = (): CropArea => ({
    x: 0,
    y: 0,
    width: stageSize.width,
    height: stageSize.height,
  })

  const resetCrop = () => {
    if (!stageSize.width || !stageSize.height) return
    setCrop({
      ...getFullCrop(),
    })
  }

  useEffect(() => {
    setCrop({ x: 0, y: 0, width: 0, height: 0 })
  }, [file, previewUrl])

  useEffect(() => {
    if (stageSize.width && stageSize.height && crop.width === 0) {
      setCrop(getFullCrop())
    }
  }, [stageSize.width, stageSize.height, crop.width])

  useEffect(() => {
    const image = imageRef.current
    if (!image) return

    const updateStageSize = () => {
      const bounds = image.getBoundingClientRect()
      setStageSize({ width: bounds.width, height: bounds.height })
    }

    updateStageSize()
    const observer = new ResizeObserver(updateStageSize)
    observer.observe(image)
    return () => observer.disconnect()
  }, [previewUrl])

  const getPoint = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = stageRef.current?.getBoundingClientRect()
    if (!bounds) return { x: 0, y: 0 }
    return {
      x: clamp(event.clientX - bounds.left, 0, bounds.width),
      y: clamp(event.clientY - bounds.top, 0, bounds.height),
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>, handle: Handle) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getPoint(event)
    interactionRef.current = {
      handle,
      startX: point.x,
      startY: point.y,
      crop: { ...crop },
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current
    if (!interaction || !stageSize.width || !stageSize.height) return

    const point = getPoint(event)
    const deltaX = point.x - interaction.startX
    const deltaY = point.y - interaction.startY
    const start = interaction.crop
    const minimum = 32
    let next = { ...start }

    if (interaction.handle === 'move') {
      next.x = clamp(start.x + deltaX, 0, stageSize.width - start.width)
      next.y = clamp(start.y + deltaY, 0, stageSize.height - start.height)
    } else {
      if (interaction.handle.includes('w')) {
        const right = start.x + start.width
        next.x = clamp(start.x + deltaX, 0, right - minimum)
        next.width = right - next.x
      }
      if (interaction.handle.includes('e')) {
        next.width = clamp(start.width + deltaX, minimum, stageSize.width - start.x)
      }
      if (interaction.handle.includes('n')) {
        const bottom = start.y + start.height
        next.y = clamp(start.y + deltaY, 0, bottom - minimum)
        next.height = bottom - next.y
      }
      if (interaction.handle.includes('s')) {
        next.height = clamp(start.height + deltaY, minimum, stageSize.height - start.y)
      }
    }

    setCrop(next)
  }

  const finishInteraction = (event: React.PointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    interactionRef.current = null
  }

  const applyAspectPreset = (preset: AspectPreset) => {
    if (preset === 'free' || !stageSize.width || !stageSize.height) {
      resetCrop()
      return
    }

    const ratios: Record<Exclude<AspectPreset, 'free'>, number> = {
      square: 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
      A4: 210 / 297,
      A6: 105 / 148,
    }
    const ratio = ratios[preset]
    let width = stageSize.width * 0.86
    let height = width / ratio

    if (height > stageSize.height * 0.86) {
      height = stageSize.height * 0.86
      width = height * ratio
    }

    setCrop({
      x: (stageSize.width - width) / 2,
      y: (stageSize.height - height) / 2,
      width,
      height,
    })
  }

  const handleApply = async () => {
    const image = imageRef.current
    if (!image || crop.width < 32 || crop.height < 32 || !stageSize.width) return

    setIsApplying(true)
    try {
      const canvas = document.createElement('canvas')
      const scaleX = image.naturalWidth / stageSize.width
      const scaleY = image.naturalHeight / stageSize.height
      canvas.width = Math.max(1, Math.round(crop.width * scaleX))
      canvas.height = Math.max(1, Math.round(crop.height * scaleY))
      const context = canvas.getContext('2d')
      if (!context) return

      context.drawImage(
        image,
        Math.round(crop.x * scaleX),
        Math.round(crop.y * scaleY),
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      const mimeType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mimeType, 0.92),
      )
      if (!blob) return

      const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png'
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const croppedFile = new File([blob], `${baseName}-cropped.${extension}`, {
        type: mimeType,
        lastModified: Date.now(),
      })
      onApply(croppedFile, URL.createObjectURL(blob))
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <section className="border border-lux-ink/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <Crop size={18} className="text-lux-copper" />
            Crop image
          </h2>
          <p className="mt-1 text-xs leading-5 text-lux-ink/50">
            Move the frame or drag its handles. Use a preset for predictable page proportions.
          </p>
        </div>
        <button
          type="button"
          onClick={resetCrop}
          className="flex min-h-10 items-center gap-1.5 text-xs font-bold text-lux-ink/55 hover:text-lux-copper"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Crop aspect ratio">
        <span className="mr-1 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-lux-ink/40">
          <Maximize2 size={13} /> Ratio
        </span>
        {(['free', 'square', '4:3', '16:9', 'A4', 'A6'] as AspectPreset[]).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => applyAspectPreset(preset)}
            className="min-h-9 rounded-full border border-lux-ink/15 px-3 text-xs font-bold text-lux-ink/65 transition-colors hover:border-lux-copper hover:text-lux-copper"
          >
            {preset === 'free' ? 'Free' : preset === 'square' ? '1:1' : preset}
          </button>
        ))}
      </div>

      <div className="flex min-h-[240px] items-center justify-center overflow-hidden bg-lux-ink/90 p-3">
        <div ref={stageRef} className="relative max-h-[420px] max-w-full select-none touch-none">
          <img
            ref={imageRef}
            src={previewUrl}
            alt="Image crop preview"
            className="block max-h-[420px] max-w-full object-contain"
            draggable={false}
          />
          {stageSize.width > 0 && (
            <div
              className="absolute border-2 border-lux-copper bg-lux-copper/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]"
              style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
              onPointerDown={(event) => handlePointerDown(event, 'move')}
              onPointerMove={handlePointerMove}
              onPointerUp={finishInteraction}
              onPointerCancel={finishInteraction}
            >
              {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as Handle[]).map((handle) => (
                <button
                  key={handle}
                  type="button"
                  aria-label={`Resize crop ${handle}`}
                  className={`absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-lux-copper shadow ${
                    handle.includes('n') ? 'top-0' : handle.includes('s') ? 'top-full' : 'top-1/2'
                  } ${
                    handle.includes('w') ? 'left-0' : handle.includes('e') ? 'left-full' : 'left-1/2'
                  }`}
                  onPointerDown={(event) => handlePointerDown(event, handle)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishInteraction}
                  onPointerCancel={finishInteraction}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleApply()}
        disabled={isApplying || crop.width < 32 || crop.height < 32 || !stageSize.width}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-lux-ink px-5 py-3 text-sm font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:bg-lux-copper disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Check size={17} />
        {isApplying ? 'Applying crop…' : 'Apply crop'}
      </button>
    </section>
  )
}
