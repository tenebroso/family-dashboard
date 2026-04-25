import React, { useRef } from 'react'
import { C, F } from '../tokens'

type Variant = 'gold' | 'outline' | 'ghost'

interface PrimaryBtnProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: Variant
  type?: 'button' | 'submit'
}

const VARIANTS: Record<Variant, { bg: string; color: string; border?: string }> = {
  gold:    { bg: C.gold, color: '#0E0E0C' },
  outline: { bg: 'transparent', color: C.text, border: `1.5px solid ${C.hairStrong}` },
  ghost:   { bg: 'rgba(201,168,76,0.08)', color: C.gold },
}

export function PrimaryBtn({ children, onClick, disabled, variant = 'gold', type = 'button' }: PrimaryBtnProps) {
  const s = VARIANTS[variant]
  const ref = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => { if (!disabled && ref.current) ref.current.style.transform = 'scale(0.98)' }}
      onPointerUp={() => { if (ref.current) ref.current.style.transform = '' }}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = '' }}
      style={{
        width: '100%',
        height: 54,
        borderRadius: 12,
        background: disabled ? '#252320' : s.bg,
        color: disabled ? C.muted : s.color,
        border: s.border ?? 'none',
        fontFamily: F.syne,
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.1s, opacity 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}
