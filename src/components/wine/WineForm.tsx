import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { theme } from '../../constants/theme'
import type { Wine } from '../../types'

interface WineFormProps {
  initialData: Partial<Wine>
  onSubmit: (data: Partial<Wine>) => void
  loading: boolean
}

export default function WineForm({ initialData, onSubmit, loading }: WineFormProps) {
  const [data, setData]           = useState<Partial<Wine>>(initialData)
  const [attempted, setAttempted] = useState(false)

  function set(field: keyof Wine, value: string | number | null) {
    setData(d => ({ ...d, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAttempted(true)
    if (!data.nombre?.trim()) return
    onSubmit(data)
  }

  const nombreVacio = !data.nombre?.trim()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre *"
        value={data.nombre ?? ''}
        onChange={e => set('nombre', e.target.value)}
        placeholder="Nombre del vino"
        error={attempted && nombreVacio ? 'El nombre es obligatorio' : undefined}
        required
      />
      <Input
        label="Bodega"
        value={data.bodega ?? ''}
        onChange={e => set('bodega', e.target.value || null)}
        placeholder="Nombre de la bodega"
      />
      <Input
        label="Añada"
        type="number"
        inputMode="numeric"
        value={data.anada ?? ''}
        onChange={e => {
          const v = parseInt(e.target.value)
          set('anada', !isNaN(v) && v >= 1800 && v <= 2025 ? v : null)
        }}
        placeholder="Ej: 2019"
      />
      <Input
        label="Región"
        value={data.region ?? ''}
        onChange={e => set('region', e.target.value || null)}
        placeholder="Ej: Rioja, Ribera del Duero"
      />
      <Input
        label="Denominación de origen"
        value={data.denominacion ?? ''}
        onChange={e => set('denominacion', e.target.value || null)}
        placeholder="Ej: DOCa Rioja"
      />
      <Input
        label="Uva / varietal"
        value={data.uva ?? ''}
        onChange={e => set('uva', e.target.value || null)}
        placeholder="Ej: Tempranillo, Garnacha"
      />

      <Button
        type="submit"
        disabled={nombreVacio && attempted}
        loading={loading}
        className="w-full mt-2"
        style={{ background: theme.colors.primary }}
      >
        Guardar en mi bodega
      </Button>
    </form>
  )
}
