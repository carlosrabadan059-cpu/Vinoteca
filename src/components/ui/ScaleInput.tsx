import { theme } from '../../constants/theme'

interface ScaleInputProps {
  label:    string
  minLabel: string
  maxLabel: string
  value:    number | null
  onChange: (v: number | null) => void
  steps?:   number
}

/** Escala de puntos 1–N estilo cuaderno Moleskine. Pulsar el punto activo lo borra. */
export default function ScaleInput({ label, minLabel, maxLabel, value, onChange, steps = 5 }: ScaleInputProps) {
  const t = theme
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: t.font.sm, fontWeight: 600, color: t.colors.text }}>{label}</span>
        <div className="flex gap-2" role="radiogroup" aria-label={label}>
          {Array.from({ length: steps }, (_, i) => i + 1).map(n => {
            const filled = value !== null && n <= value
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                aria-label={`${label} ${n} de ${steps}`}
                onClick={() => onChange(value === n ? null : n)}
                style={{
                  width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', padding: 0,
                  background: filled ? t.colors.gold : 'transparent',
                  border: `1.5px solid ${filled ? t.colors.gold : t.colors.borderSubtle}`,
                }}
              />
            )
          })}
        </div>
      </div>
      <div className="flex justify-between" style={{ fontSize: t.font.xs, color: t.colors.muted }}>
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}
