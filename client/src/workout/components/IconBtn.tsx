import React from 'react'
import { C } from '../tokens'

interface IconBtnProps {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  disabled?: boolean
}

export function IconBtn({ children, onClick, active, disabled }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: 'none',
        background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
        color: active ? C.gold : C.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}
