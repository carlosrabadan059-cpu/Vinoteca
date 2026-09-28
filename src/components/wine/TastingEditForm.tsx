import { useState } from 'react'
import Button from '../ui/Button'
import JournalSheetForm from './JournalSheetForm'
import type { JournalSheetData } from '../../lib/cuadernoHelpers'
import type { Tasting, Wine } from '../../types'

interface TastingEditFormProps {
  tasting:  Tasting
  onSave:   (fields: Partial<Tasting>) => Promise<void>
  onCancel: () => void
  /** Para la revisión del tutor de cata en cada sección. */
  wine?:    Wine | null
}

/** Edición de una página del cuaderno: reutiliza la ficha guiada de NuevaCata. */
export default function TastingEditForm({ tasting, onSave, onCancel, wine }: TastingEditFormProps) {
  const [saving, setSaving] = useState(false)

  const initial: JournalSheetData = {
    fecha:             tasting.fecha,
    lugar:             tasting.lugar,
    con_quien:         tasting.con_quien,
    ocasion:           tasting.ocasion,
    color_descripcion: tasting.color_descripcion,
    aroma:             tasting.aroma,
    dulzor:            tasting.dulzor,
    acidez:            tasting.acidez,
    tanino:            tasting.tanino,
    cuerpo:            tasting.cuerpo,
    final:             tasting.final,
    puntuacion:        tasting.puntuacion,
    maridaje:          tasting.maridaje,
    notas_cata:        tasting.notas_cata,
    botella_terminada: tasting.botella_terminada,
  }

  async function handleSubmit(data: JournalSheetData) {
    setSaving(true)
    try {
      await onSave({
        ...data,
        lugar:     data.lugar?.trim()     || null,
        ocasion:   data.ocasion?.trim()   || null,
        con_quien: data.con_quien?.trim() || null,
        // Editar no vuelve a descontar botellas: se conserva el valor original
        botella_terminada: tasting.botella_terminada,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <JournalSheetForm
        initial={initial}
        showBottleDone={false}
        saving={saving}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
        wine={wine ?? undefined}
      />
      <Button variant="secondary" className="w-full" onClick={onCancel} disabled={saving}>
        Cancelar
      </Button>
    </div>
  )
}
