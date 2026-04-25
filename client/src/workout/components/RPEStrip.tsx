import { C, F } from '../tokens'

interface RPEStripProps {
  value: string | number | null
  onChange: (v: string) => void
  disabled?: boolean
}

export function RPEStrip({ value, onChange, disabled }: RPEStripProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.2em', color: C.muted }}>RPE</span>
        <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', color: C.muted2 }}>1 EASY · 10 MAX</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const selected = String(n) === String(value)
          const intensity = n / 10
          return (
            <button
              key={n}
              disabled={disabled}
              onClick={() => onChange(String(n))}
              style={{
                height: 46,
                borderRadius: 8,
                background: selected ? C.gold : `rgba(201,168,76,${intensity * 0.16})`,
                color: selected ? C.bg : C.text,
                border: 'none',
                cursor: disabled ? 'default' : 'pointer',
                fontFamily: F.mono,
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
