import { C, F } from '../tokens'
import { ChevronIcon } from '../icons'
import { Sparkline } from './Sparkline'
import type { ExerciseHistorySession, ExerciseHistorySet } from '../types'

interface ExerciseHistoryStripProps {
  history: ExerciseHistorySession[]
  todayTopWeight: number
  onOpen: () => void
}

function topSet(sets: ExerciseHistorySet[]): ExerciseHistorySet | null {
  if (sets.length === 0) return null
  return sets.reduce((a, s) => ((s.weight ?? 0) > (a.weight ?? 0) ? s : a), sets[0])
}

function sessionTopValue(s: ExerciseHistorySession): number {
  const tops = s.sets.map(set => Number(set.weight) || 0)
  const top = Math.max(...tops, 0)
  if (top > 0) return top
  const reps = s.sets.map(set => Number(set.reps) || 0)
  return Math.max(...reps, 0)
}

export function ExerciseHistoryStrip({ history, todayTopWeight, onOpen }: ExerciseHistoryStripProps) {
  if (!history || history.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderRadius: 8,
        background: 'rgba(201,168,76,0.04)',
        border: `1px dashed ${C.hair}`,
        marginTop: 10, marginBottom: 4,
      }}>
        <span style={{ fontSize: 14 }}>✦</span>
        <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.16em', color: C.gold, fontWeight: 500, whiteSpace: 'nowrap' }}>
          FIRST TIME — SET A BASELINE
        </span>
      </div>
    )
  }

  const topValues = history.slice().reverse().map(sessionTopValue)
  const last = history[0]
  const lastTop = topSet(last.sets)
  const lastTopWeight = Number(lastTop?.weight) || 0
  const delta = todayTopWeight && lastTopWeight ? todayTopWeight - lastTopWeight : null

  return (
    <button
      onClick={onOpen}
      type="button"
      style={{
        width: '100%', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8,
        background: 'rgba(201,168,76,0.04)',
        border: `1px solid ${C.hair}`,
        cursor: 'pointer', marginTop: 10, marginBottom: 4,
        color: 'inherit',
      }}
    >
      <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.18em', color: C.gold, fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
        LAST {history.length}
      </span>
      <Sparkline values={topValues} w={56} h={18} />
      <div style={{ display: 'flex', gap: 4, overflow: 'hidden', flex: 1 }}>
        {history.slice(0, 3).map((s, i) => {
          const top = topSet(s.sets)
          const w = Number(top?.weight) || 0
          const reps = top?.reps ?? '?'
          const label = w > 0 ? `${reps}×${w}` : `${reps}`
          return (
            <span
              key={i}
              style={{
                fontFamily: F.mono,
                fontSize: 10, fontWeight: 500,
                color: i === 0 ? C.text : C.muted,
                padding: '2px 5px', borderRadius: 3,
                background: i === 0 ? 'rgba(201,168,76,0.10)' : 'transparent',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >{label}</span>
          )
        })}
      </div>
      {delta !== null && delta !== 0 && (
        <span style={{
          fontFamily: F.mono,
          fontSize: 10, fontWeight: 500,
          color: delta > 0 ? C.gold : C.muted,
          display: 'inline-flex', alignItems: 'center', gap: 2,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
        </span>
      )}
      <ChevronIcon dir="right" color={C.muted2} size={12} />
    </button>
  )
}
