import { C, F } from '../tokens'
import type { ExerciseHistorySet } from '../types'

interface SetHistoryHintProps {
  matchedSet: ExerciseHistorySet | null
  relative: string | null
}

export function SetHistoryHint({ matchedSet, relative }: SetHistoryHintProps) {
  if (!matchedSet || !relative) return null
  const w = Number(matchedSet.weight) || 0
  const reps = matchedSet.reps ?? '?'
  const rpe = matchedSet.rpe ?? '?'
  const text = w > 0
    ? `${reps}×${w} @ RPE ${rpe}`
    : `${reps} reps @ RPE ${rpe}`
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      paddingLeft: 2, marginTop: -2, marginBottom: 8,
    }}>
      <span style={{ width: 8, height: 1, background: C.muted2 }} />
      <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.16em', color: C.muted2, fontWeight: 500, whiteSpace: 'nowrap' }}>
        LAST · {relative.toUpperCase()}
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>
        {text}
      </span>
    </div>
  )
}
