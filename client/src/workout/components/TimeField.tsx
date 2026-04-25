import { useState, useEffect } from 'react'
import { C, F } from '../tokens'

interface TimeFieldProps {
  label?: string
  value: string
  onChange: (formatted: string) => void
  disabled?: boolean
}

function formatDigits(digits: string): string {
  const d = digits.slice(-6)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, d.length - 2)}:${d.slice(-2)}`
  return `${d.slice(0, d.length - 4)}:${d.slice(-4, -2)}:${d.slice(-2)}`
}

export function TimeField({ label = 'TIME', value, onChange, disabled }: TimeFieldProps) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState(() => (value || '').replace(/\D/g, ''))

  useEffect(() => {
    setRaw((value || '').replace(/\D/g, ''))
  }, [value])

  const displayValue = raw ? formatDigits(raw) : ''

  return (
    <div>
      <div style={{
        fontFamily: F.mono,
        fontSize: 9,
        letterSpacing: '0.2em',
        color: C.muted,
        marginBottom: 6,
        textTransform: 'uppercase',
      }}>
        {label}{' '}
        <span style={{ color: C.muted2 }}>· MM:SS</span>
      </div>
      <div style={{
        height: 72,
        borderRadius: 12,
        background: disabled ? 'transparent' : C.surfaceInput,
        border: `1px solid ${focused ? C.gold : C.hair}`,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'baseline',
        transition: 'border-color 0.15s',
      }}>
        <input
          value={displayValue}
          onChange={e => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
            setRaw(digits)
            onChange(formatDigits(digits))
          }}
          placeholder="0:00"
          disabled={disabled}
          inputMode="numeric"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="wk-input-reset"
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: C.text,
            fontFamily: F.syne,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      </div>
    </div>
  )
}

export function mmssToSeconds(str: string): number {
  if (!str) return 0
  const parts = str.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] ?? 0
}

export function secondsToMmss(secs: number): string {
  if (!secs) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
