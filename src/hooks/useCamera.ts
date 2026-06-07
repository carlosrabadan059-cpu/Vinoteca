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

function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onerror = () => resolve(dataUrl)
    img.onload  = () => {
      const scale  = img.width > maxWidth ? maxWidth / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
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
