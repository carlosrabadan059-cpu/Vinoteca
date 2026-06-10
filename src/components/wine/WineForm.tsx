import { useState, useEffect } from 'react'
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

  useEffect(() => {
    setData(initialData)
  }, [initialData])

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
          set('anada', !isNaN(v) && v >= 1800 && v <= new Date().getFullYear() + 1 ? v : null)
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
      <div className="flex flex-col gap-1">
        <label style={{ fontSize: '0.75rem', color: 'inherit', opacity: 0.7 }}>Tipo</label>
        <select
          value={data.tipo ?? ''}
          onChange={e => set('tipo', e.target.value || null)}
          style={{
            background:   'rgba(26,14,16,0.9)',
            color:        'inherit',
            border:       '1px solid rgba(201,168,76,0.2)',
            borderRadius: '0.75rem',
            padding:      '0.75rem 1rem',
            fontSize:     '0.875rem',
            width:        '100%',
            appearance:   'none',
          }}
        >
          <option value="">— Sin especificar —</option>
          <option value="Tinto">Tinto</option>
          <option value="Blanco">Blanco</option>
          <option value="Rosado">Rosado</option>
          <option value="Espumoso">Espumoso</option>
          <option value="Dulce">Dulce</option>
          <option value="Fortificado">Fortificado</option>
          <option value="Naranja">Naranja</option>
        </select>
      </div>

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
