import { useState } from 'react'
import { C, F } from '../tokens'

interface BigFieldProps {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  small?: boolean
  inputMode?: 'decimal' | 'numeric' | 'text'
}

export function BigField({ label, unit, value, onChange, placeholder, disabled, small, inputMode = 'decimal' }: BigFieldProps) {
  const [focused, setFocused] = useState(false)

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
        {label}
      </div>
      <div style={{
        height: small ? 56 : 72,
        borderRadius: 12,
        background: disabled ? 'transparent' : C.surfaceInput,
        border: `1px solid ${focused ? C.gold : C.hair}`,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        transition: 'border-color 0.15s',
      }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
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
            fontSize: small ? 28 : 40,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
        <span style={{
          fontFamily: F.mono,
          fontSize: 12,
          color: C.muted,
          fontWeight: 500,
          paddingBottom: 6,
        }}>
          {unit}
        </span>
      </div>
    </div>
  )
}
