import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useTastings } from '../../hooks/useTastings'
import { useToastStore } from '../../store/toastStore'
import { theme } from '../../constants/theme'

interface ConsumoQuickFormProps {
  open:     boolean
  wineId:   string
  onClose:  () => void
  onSaved?: () => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ConsumoQuickForm({ open, wineId, onClose, onSaved }: ConsumoQuickFormProps) {
  const { createTasting } = useTastings()
  const toast             = useToastStore()

  const [fecha,             setFecha]            = useState(today)
  const [ocasion,           setOcasion]          = useState('')
  const [lugar,             setLugar]            = useState('')
  const [botellaTerminada,  setBotellaTerminada] = useState(true)
  const [saving,            setSaving]           = useState(false)

  function handleClose() {
    if (saving) return
    setFecha(today())
    setOcasion('')
    setLugar('')
    setBotellaTerminada(true)
    onClose()
  }

  async function handleSave() {
    if (!fecha) return
    setSaving(true)
    try {
      await createTasting({
        wine_id:           wineId,
        fecha,
        es_consumo_rapido: true,
        botella_terminada: botellaTerminada,
        ocasion:           ocasion.trim() || null,
        lugar:             lugar.trim()   || null,
      })
      toast.show('Consumo registrado')
      handleClose()
      onSaved?.()
    } catch {
      toast.show('Error al guardar el consumo', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background:  theme.colors.surface2,
    border:      `1px solid ${theme.colors.border}`,
    borderRadius: 10,
    color:        theme.colors.cream,
    fontSize:     theme.font.sm,
    padding:      '10px 12px',
    width:        '100%',
    outline:      'none',
  } as const

  const labelStyle = {
    fontSize: '0.75rem',
    color:    theme.colors.muted,
    fontWeight: 500,
    marginBottom: 4,
    display: 'block' as const,
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nuevo consumo">
      {/* Fecha */}
      <div style={{ marginBottom: 4 }}>
        <label style={labelStyle}>Fecha *</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Ocasión */}
      <div style={{ marginBottom: 4 }}>
        <label style={labelStyle}>Ocasión</label>
        <input
          type="text"
          value={ocasion}
          onChange={e => setOcasion(e.target.value)}
          placeholder="Cena de cumpleaños, aperitivo..."
          style={inputStyle}
        />
      </div>

      {/* Lugar */}
      <div style={{ marginBottom: 4 }}>
        <label style={labelStyle}>Lugar</label>
        <input
          type="text"
          value={lugar}
          onChange={e => setLugar(e.target.value)}
          placeholder="Restaurante, ciudad, casa..."
          style={inputStyle}
        />
      </div>

      {/* Botella terminada */}
      <button
        onClick={() => setBotellaTerminada(v => !v)}
        className="flex items-center w-full text-left"
        style={{ gap: 12, marginTop: 8 }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width:       22,
            height:      22,
            borderRadius: 5,
            background:  botellaTerminada ? theme.colors.primary : 'transparent',
            border:      `1.5px solid ${botellaTerminada ? theme.colors.primary : theme.colors.muted}`,
          }}
        >
          {botellaTerminada && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cream} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <div>
          <p style={{ fontSize: theme.font.sm, color: theme.colors.cream, fontWeight: 500 }}>
            Botella terminada
          </p>
          <p style={{ fontSize: '0.70rem', color: '#5A4A4E', marginTop: 2 }}>
            Se ha terminado la botella en este consumo
          </p>
        </div>
      </button>

      {/* Acciones */}
      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          loading={saving}
          disabled={!fecha}
        >
          Guardar consumo
        </Button>
      </div>
    </Modal>
  )
}
