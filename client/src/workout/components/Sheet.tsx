import React from 'react'
import { C, F } from '../tokens'
import { CloseIcon } from '../icons'
import { IconBtn } from './IconBtn'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null

  return (
    <>
      <div
        className="wk-scrim"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 100,
        }}
      />
      <div
        className="wk-sheet"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 101,
          background: '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${C.hair}`,
          borderBottom: 'none',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.muted2 }} />
        </div>

        {title && (
          <div style={{
            padding: '16px 24px 12px',
            borderBottom: `1px solid ${C.hair}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{ fontFamily: F.syne, fontSize: 18, fontWeight: 700, color: C.text }}>{title}</div>
            <IconBtn onClick={onClose}><CloseIcon size={14} /></IconBtn>
          </div>
        )}

        <div className="wk-noscroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
          {children}
        </div>
      </div>
    </>
  )
}
