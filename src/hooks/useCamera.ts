function pickFile(capture?: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (capture) input.setAttribute('capture', 'environment')
    input.style.display = 'none'
    document.body.appendChild(input)

    const cleanup = () => {
      if (document.body.contains(input)) document.body.removeChild(input)
    }

    input.addEventListener('cancel', () => { cleanup(); resolve(null) })
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      cleanup()
      if (!file) { resolve(null); return }
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })

    input.click()
  })
}

// Reads EXIF orientation tag from a JPEG dataUrl (returns 1-8, or 1 if absent)
function readExifOrientation(dataUrl: string): number {
  try {
    const base64 = dataUrl.split(',')[1]
    const binary = atob(base64.slice(0, 1024)) // first 1 KB is enough for EXIF
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return 1 // not JPEG
    let i = 2
    while (i < bytes.length - 1) {
      if (bytes[i] !== 0xFF) break
      const marker = bytes[i + 1]
      const len = (bytes[i + 2] << 8) | bytes[i + 3]
      if (marker === 0xE1) { // APP1 — EXIF
        const exif = bytes.slice(i + 4, i + 2 + len)
        const littleEndian = exif[6] === 0x49
        const read16 = (o: number) => littleEndian
          ? exif[o] | (exif[o + 1] << 8)
          : (exif[o] << 8) | exif[o + 1]
        const read32 = (o: number) => littleEndian
          ? exif[o] | (exif[o+1]<<8) | (exif[o+2]<<16) | (exif[o+3]<<24)
          : (exif[o]<<24) | (exif[o+1]<<16) | (exif[o+2]<<8) | exif[o+3]
        const ifdOffset = read32(10)
        const entries = read16(6 + ifdOffset)
        for (let e = 0; e < entries; e++) {
          const base = 6 + ifdOffset + 2 + e * 12
          if (read16(base) === 0x0112) return read16(base + 8)
        }
      }
      i += 2 + len
    }
  } catch { /* ignore */ }
  return 1
}

function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const orientation = readExifOrientation(dataUrl)
    const img = new Image()
    img.onerror = () => resolve(dataUrl)
    img.onload  = () => {
      // orientations 5-8 swap width/height
      const swapped = orientation >= 5
      const srcW = img.width, srcH = img.height
      const scale = (swapped ? srcH : srcW) > maxWidth ? maxWidth / (swapped ? srcH : srcW) : 1
      const dstW = Math.round((swapped ? srcH : srcW) * scale)
      const dstH = Math.round((swapped ? srcW : srcH) * scale)
      const canvas = document.createElement('canvas')
      canvas.width  = dstW
      canvas.height = dstH
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      // Apply EXIF rotation so the image is always upright
      ctx.save()
      ctx.translate(dstW / 2, dstH / 2)
      const angle = { 3: 180, 6: 90, 8: -90, 2: 0, 4: 0, 5: 90, 7: -90 }[orientation] ?? 0
      const flipH  = [2, 4, 5, 7].includes(orientation)
      if (flipH) ctx.scale(-1, 1)
      ctx.rotate((angle * Math.PI) / 180)
      ctx.drawImage(img, -srcW * scale / 2, -srcH * scale / 2, srcW * scale, srcH * scale)
      ctx.restore()
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

export function useCamera() {
  const takePhoto       = () => pickFile(true)
  const pickFromGallery = () => pickFile(false)
  return { takePhoto, pickFromGallery, compressImage }
}
