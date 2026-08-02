// Utilidades de calidad de imagen sobre dataUrls JPEG.
// Funciones puras: reciben un dataUrl y devuelven un número o un dataUrl nuevo.
// No dependen de React ni del DOM más allá de <canvas> y <img> en memoria.

/** Por debajo de esta varianza laplaciana la foto se considera potencialmente borrosa. */
export const SHARPNESS_THRESHOLD = 60

/** Ancho al que se reduce la imagen para medir nitidez (suficiente y barato de calcular). */
const SHARPNESS_SAMPLE_WIDTH = 200

/** Porcentaje de píxeles descartados en cada extremo del histograma al auto-mejorar. */
const HISTOGRAM_CLIP_RATIO = 0.01

/** Rango mínimo de luminosidad para que auto-mejorar tenga sentido. */
const MIN_HISTOGRAM_RANGE = 8

/** Calidad JPEG de salida — misma que usaba CameraView antes de este módulo. */
const JPEG_QUALITY = 0.85

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = dataUrl
  })
}

/**
 * Estima la nitidez de la imagen como la varianza de un filtro laplaciano
 * sobre una versión reducida en escala de grises. Valores altos = más nitidez.
 * Devuelve 0 si la imagen no se puede analizar.
 */
export async function estimateSharpness(dataUrl: string): Promise<number> {
  try {
    const img = await loadImage(dataUrl)
    const scale = img.width > SHARPNESS_SAMPLE_WIDTH ? SHARPNESS_SAMPLE_WIDTH / img.width : 1
    const w = Math.max(3, Math.round(img.width  * scale))
    const h = Math.max(3, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width  = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return 0
    ctx.drawImage(img, 0, 0, w, h)

    const { data } = ctx.getImageData(0, 0, w, h)
    const gray = new Float32Array(w * h)
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    }

    let sum = 0
    let sumSq = 0
    let n = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x
        const lap = gray[p - w] + gray[p + w] + gray[p - 1] + gray[p + 1] - 4 * gray[p]
        sum   += lap
        sumSq += lap * lap
        n++
      }
    }
    if (n === 0) return 0
    const mean = sum / n
    return sumSq / n - mean * mean
  } catch {
    return 0
  }
}

/**
 * Auto-estiramiento de histograma (auto-niveles): normaliza el rango de
 * luminosidad de la imagen a 0-255, descartando el 1% de píxeles extremos.
 * Útil para etiquetas fotografiadas con luz cálida o tenue.
 * Si la imagen ya está bien distribuida (o falla el análisis), devuelve el dataUrl original.
 */
export async function autoEnhance(dataUrl: string): Promise<string> {
  try {
    const img = await loadImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width  = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const hist = new Uint32Array(256)
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0
      hist[lum]++
    }

    const total = (data.length / 4) | 0
    const clip = Math.max(1, Math.floor(total * HISTOGRAM_CLIP_RATIO))

    let acc = 0
    let lo = 0
    for (let v = 0; v < 256; v++) {
      acc += hist[v]
      if (acc > clip) { lo = v; break }
    }
    acc = 0
    let hi = 255
    for (let v = 255; v >= 0; v--) {
      acc += hist[v]
      if (acc > clip) { hi = v; break }
    }

    if (hi - lo < MIN_HISTOGRAM_RANGE) return dataUrl

    const scale = 255 / (hi - lo)
    const lut = new Uint8ClampedArray(256)
    for (let v = 0; v < 256; v++) lut[v] = (v - lo) * scale

    for (let i = 0; i < data.length; i += 4) {
      data[i]     = lut[data[i]]
      data[i + 1] = lut[data[i + 1]]
      data[i + 2] = lut[data[i + 2]]
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } catch {
    return dataUrl
  }
}

export interface ImageAdjustments {
  /** Grados de rotación: 0 o 180 (los únicos que produce CameraView). */
  rotation: number
  /** Ajuste de brillo, -50 a 50. 0 = sin cambio. */
  brightness: number
}

/**
 * Aplica rotación y brillo en una sola pasada de canvas.
 * El brillo se aplica por manipulación de píxeles (no ctx.filter) para que el
 * resultado sea idéntico en todos los navegadores.
 * Si falla, devuelve el dataUrl original en vez de romper el flujo de captura.
 */
export async function applyAdjustments(
  dataUrl: string,
  { rotation, brightness }: ImageAdjustments
): Promise<string> {
  if (rotation === 0 && brightness === 0) return dataUrl
  try {
    const img = await loadImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width  = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return dataUrl

    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    } else {
      ctx.drawImage(img, 0, 0)
    }

    if (brightness !== 0) {
      const delta = brightness * 2.55
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const lut = new Uint8ClampedArray(256)
      for (let v = 0; v < 256; v++) lut[v] = v + delta
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = lut[data[i]]
        data[i + 1] = lut[data[i + 1]]
        data[i + 2] = lut[data[i + 2]]
      }
      ctx.putImageData(imageData, 0, 0)
    }

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } catch {
    return dataUrl
  }
}
