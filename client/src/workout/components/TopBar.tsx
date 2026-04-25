import React from 'react'
import { C, F } from '../tokens'

interface TopBarProps {
  left?: React.ReactNode
  right?: React.ReactNode
  title: string
  eyebrow?: string
  bg?: string
}

export function TopBar({ left, right, title, eyebrow, bg = C.bg }: TopBarProps) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: bg,
      borderBottom: `1px solid ${C.hair}`,
      transition: 'background 0.2s',
    }}>
      <div style={{
        height: 56,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ minWidth: 44, display: 'flex', alignItems: 'center' }}>{left}</div>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0, padding: '0 8px' }}>
          {eyebrow && (
            <div style={{
              fontFamily: F.mono,
              fontSize: 9,
              letterSpacing: '0.18em',
              color: C.muted,
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              {eyebrow}
            </div>
          )}
          <div style={{
            fontFamily: F.syne,
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </div>
        </div>
        <div style={{ minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{right}</div>
      </div>
    </div>
  )
}
