import { C, F } from '../tokens'

interface RPEPickerProps {
  value: string | null
  onSelect: (v: string) => void
  onClose: () => void
}

export function RPEPicker({ value, onSelect, onClose }: RPEPickerProps) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
        }}
      />
      <div
        className="wk-fade-in"
        style={{
          position: 'fixed',
          left: 16,
          right: 16,
          bottom: 100,
          zIndex: 201,
          background: '#FFFFFF',
          borderRadius: 16,
          border: `1px solid ${C.hair}`,
          padding: 16,
        }}
      >
        <div style={{
          fontFamily: F.mono,
          fontSize: 9,
          letterSpacing: '0.2em',
          color: C.muted,
          marginBottom: 10,
        }}>
          SELECT RPE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
            const selected = String(n) === String(value)
            const intensity = n / 10
            return (
              <button
                key={n}
                onClick={() => onSelect(String(n))}
                style={{
                  height: 44,
                  borderRadius: 8,
                  background: selected ? C.gold : `rgba(255,74,28,${intensity * 0.18})`,
                  color: selected ? C.bg : C.text,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: F.mono,
                  fontSize: 13,
                  fontWeight: 600,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {n}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: F.mono, fontSize: 9, color: C.muted2, letterSpacing: '0.1em' }}>EASY</span>
          <span style={{ fontFamily: F.mono, fontSize: 9, color: C.muted2, letterSpacing: '0.1em' }}>MAX</span>
        </div>
      </div>
    </>
  )
}
