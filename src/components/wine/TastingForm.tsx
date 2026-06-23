import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { theme } from '../../constants/theme'
import type { Tasting } from '../../types'

interface TastingFormProps {
  initialData?: Partial<Tasting>
  onSubmit: (data: Partial<Tasting>) => void
  loading: boolean
}

export default function TastingForm({ initialData = {}, onSubmit, loading }: TastingFormProps) {
  const today = new Date().toISOString().slice(0, 10)

  const [data, setData] = useState<Partial<Tasting>>({
    fecha:             today,
    puntuacion:        null,
    color_descripcion: null,
    aroma:             null,
    notas_cata:        null,
    maridaje:          null,
    ocasion:           null,
    lugar:             null,
    ...initialData,
  })

  function set(field: keyof Tasting, value: string | number | null) {
    setData(d => ({ ...d, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      <Input
        label="Fecha de la cata"
        type="date"
        value={data.fecha ?? today}
        onChange={e => set('fecha', e.target.value)}
        required
      />

      {/* Puntuación con indicador visual */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" style={{ color: theme.colors.muted }}>
          Puntuación
          {data.puntuacion !== null && (
            <span className="ml-2 font-bold" style={{ color: theme.colors.gold }}>
              {data.puntuacion} pts
            </span>
          )}
        </label>
        <input
          type="range"
          min={50}
          max={100}
          step={1}
          value={data.puntuacion ?? 75}
          onChange={e => set('puntuacion', Number(e.target.value))}
          className="w-full"
          style={{ accentColor: theme.colors.gold }}
        />
        <div className="flex justify-between text-xs" style={{ color: theme.colors.muted }}>
          <span>50</span>
          <span
            className="cursor-pointer text-xs"
            style={{ color: theme.colors.muted }}
            onClick={() => set('puntuacion', null)}
          >
            {data.puntuacion === null ? 'Sin puntuación' : 'Quitar puntuación'}
          </span>
          <span>100</span>
        </div>
      </div>

      <Input
        label="Color"
        value={data.color_descripcion ?? ''}
        onChange={e => set('color_descripcion', e.target.value || null)}
        placeholder="Ej: Rojo rubí con reflejos violáceos"
      />

      <Input
        label="Aroma"
        value={data.aroma ?? ''}
        onChange={e => set('aroma', e.target.value || null)}
        placeholder="Ej: Fruta roja madura, especias, madera"
      />

      {/* Notas de cata — textarea */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" style={{ color: theme.colors.muted }}>
          Notas de cata
        </label>
        <textarea
          value={data.notas_cata ?? ''}
          onChange={e => set('notas_cata', e.target.value || null)}
          placeholder="Describe lo que percibes en nariz, boca y retrogusto…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl outline-none text-base resize-none"
          style={{
            background: theme.colors.surface,
            color:      theme.colors.cream,
            border:     '1px solid #3A2A2E',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <Input
        label="Maridaje"
        value={data.maridaje ?? ''}
        onChange={e => set('maridaje', e.target.value || null)}
        placeholder="Ej: Carnes rojas, quesos curados"
      />

      <Input
        label="Ocasión"
        value={data.ocasion ?? ''}
        onChange={e => set('ocasion', e.target.value || null)}
        placeholder="Cena de cumpleaños, aperitivo..."
      />

      <Input
        label="Lugar"
        value={data.lugar ?? ''}
        onChange={e => set('lugar', e.target.value || null)}
        placeholder="Restaurante, ciudad, casa..."
      />

      <Button type="submit" loading={loading} className="w-full mt-1">
        Guardar cata
      </Button>
    </form>
  )
}
