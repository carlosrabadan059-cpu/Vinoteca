export interface CaptureSource {
  /**
   * Inicia la fuente de captura.
   * Devuelve un MediaStream si la fuente produce vídeo continuo (getUserMedia, Capacitor, desktop).
   * Devuelve null si la fuente no necesita un stream (archivo local, mock para testing).
   */
  start(): Promise<MediaStream | null>
  /**
   * Libera todos los recursos de la fuente.
   * Recibe el stream devuelto por start() — puede ser null.
   */
  stop(stream: MediaStream | null): void
  /** Captura una imagen y la devuelve como dataUrl JPEG */
  captureFrame(video: HTMLVideoElement): Promise<string>
  /**
   * Configuración de zoom deseada. La fuente decide si la aplica o la ignora.
   * Preparado para V1.3.2 — no se usa en V1.3.1.
   */
  setZoom?(level: number): Promise<void>
  /** Nivel de zoom actual, si la fuente lo soporta */
  getZoomCapabilities?(): { min: number; max: number; step: number } | null
}

// ── Implementación getUserMedia ────────────────────────────────────────────

function captureFrameFromVideo(video: HTMLVideoElement, quality = 0.85): string {
  const canvas = document.createElement('canvas')
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible')
  ctx.drawImage(video, 0, 0)
  return canvas.toDataURL('image/jpeg', quality)
}

export function getUserMediaSource(
  constraints: MediaStreamConstraints = {
    video: {
      facingMode: 'environment',
      width:      { ideal: 1920 },
      height:     { ideal: 1080 },
    },
  }
): CaptureSource {
  let _track: MediaStreamTrack | null = null

  return {
    async start(): Promise<MediaStream | null> {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      _track = stream.getVideoTracks()[0] ?? null
      return stream
    },

    stop(stream: MediaStream | null) {
      stream?.getTracks().forEach(t => t.stop())
      _track = null
    },

    async captureFrame(video) {
      return captureFrameFromVideo(video)
    },

    async setZoom(level) {
      if (!_track) return
      const capabilities = _track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } }
      if (!capabilities.zoom) return
      await _track.applyConstraints({ advanced: [{ zoom: level } as MediaTrackConstraintSet] })
    },

    getZoomCapabilities() {
      if (!_track) return null
      const capabilities = _track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } }
      return capabilities.zoom ?? null
    },
  }
}
