import { useRef } from 'react'
import { C, F } from '../tokens'

interface PillInputProps {
  value: string
  onChange?: (v: string) => void
  onFocus?: () => void
  placeholder?: string
  width?: number
  disabled?: boolean
  inputMode?: 'decimal' | 'numeric' | 'text'
}

export function PillInput({ value, onChange, onFocus, placeholder, width = 60, disabled, inputMode = 'decimal' }: PillInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <input
      ref={ref}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      onFocus={() => {
        if (ref.current) ref.current.style.borderColor = C.gold
        onFocus?.()
      }}
      onBlur={() => {
        if (ref.current) ref.current.style.borderColor = disabled ? 'transparent' : C.hair
      }}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      className="wk-input-reset"
      style={{
        width,
        height: 40,
        borderRadius: 8,
        background: disabled ? 'transparent' : C.surfaceInput,
        border: `1px solid ${disabled ? 'transparent' : C.hair}`,
        color: C.text,
        textAlign: 'center',
        padding: '0 6px',
        fontFamily: F.mono,
        fontSize: 16,
        fontWeight: 500,
        transition: 'border-color 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    />
  )
}
