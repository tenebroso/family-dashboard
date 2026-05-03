import { C, F } from '../tokens'

type BadgeType = 'strength' | 'run' | 'rest' | 'yoga'

const BADGE_MAP: Record<BadgeType, { label: string; color: string; bg: string }> = {
  strength: { label: 'LIFT', color: C.gold,  bg: 'rgba(255,74,28,0.12)' },
  run:      { label: 'RUN',  color: C.teal,  bg: 'rgba(46,217,176,0.18)' },
  rest:     { label: 'REST', color: C.muted, bg: 'rgba(20,20,20,0.05)' },
  yoga:     { label: 'YOGA', color: C.rust,  bg: 'rgba(255,210,63,0.22)' },
}

export function TypeBadge({ type }: { type: BadgeType }) {
  const s = BADGE_MAP[type]
  if (!s) return null
  return (
    <span style={{
      fontFamily: F.mono,
      fontSize: 9,
      letterSpacing: '0.18em',
      fontWeight: 500,
      color: s.color,
      background: s.bg,
      padding: '3px 6px',
      borderRadius: 3,
      display: 'inline-flex',
      alignItems: 'center',
    }}>
      {s.label}
    </span>
  )
}
