import { C, F } from '../tokens'

type BadgeType = 'strength' | 'run' | 'recovery'

const BADGE_MAP: Record<BadgeType, { label: string; color: string; bg: string }> = {
  strength: { label: 'LIFT', color: C.gold,  bg: 'rgba(201,168,76,0.12)' },
  run:      { label: 'RUN',  color: C.teal,   bg: 'rgba(107,168,161,0.12)' },
  recovery: { label: 'REST', color: C.muted,  bg: 'rgba(140,133,122,0.08)' },
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
