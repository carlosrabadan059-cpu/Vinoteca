import { useCamera } from '../../hooks/useCamera'
import { theme } from '../../constants/theme'

interface ImageCaptureProps {
  label: string
  imageDataUrl?: string
  onCapture: (dataUrl: string) => void
  optional?: boolean
}

export default function ImageCapture({
  label,
  imageDataUrl,
  onCapture,
  optional = false,
}: ImageCaptureProps) {
  const { takePhoto, pickFromGallery, compressImage } = useCamera()

  async function handleCapture(source: 'camera' | 'gallery') {
    const raw = source === 'camera' ? await takePhoto() : await pickFromGallery()
    if (!raw) return
    const compressed = await compressImage(raw)
    onCapture(compressed)
  }

  if (imageDataUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        <img
          src={imageDataUrl}
          alt={label}
          className="w-full object-cover"
          style={{ maxHeight: 260 }}
        />
        <div className="absolute inset-x-3 top-3 flex gap-2">
          <button
            type="button"
            onClick={() => handleCapture('camera')}
            className="flex-1 py-2 rounded-lg text-sm font-medium backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.55)', color: theme.colors.cream }}
          >
            🔄 Volver a tomar
          </button>
          <button
            type="button"
            onClick={() => handleCapture('gallery')}
            className="flex-1 py-2 rounded-lg text-sm font-medium backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.55)', color: theme.colors.cream }}
          >
            🖼 Galería
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium mb-3" style={{ color: theme.colors.muted }}>
        {label}{optional ? <span style={{ color: theme.colors.muted }}> (opcional)</span> : null}
      </p>
      <div
        className="flex flex-col items-center gap-5 py-10 rounded-2xl border-2 border-dashed"
        style={{ borderColor: '#3A2A2E' }}
      >
        <span style={{ fontSize: 52, lineHeight: 1 }}>📷</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleCapture('camera')}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: theme.colors.primary, color: theme.colors.cream }}
          >
            Cámara
          </button>
          <button
            type="button"
            onClick={() => handleCapture('gallery')}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: theme.colors.surface, color: theme.colors.cream, border: '1px solid #3A2A2E' }}
          >
            Galería
          </button>
        </div>
      </div>
    </div>
  )
}
