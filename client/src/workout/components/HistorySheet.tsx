import { C, F } from '../tokens'
import { Sheet } from './Sheet'
import { Sparkline } from './Sparkline'
import type { ExerciseHistorySession } from '../types'

interface HistorySheetProps {
  exerciseName: string
  history: ExerciseHistorySession[]
  onClose: () => void
}

interface AggStatProps {
  label: string
  value: string | number
  unit?: string
}

function AggStat({ label, value, unit }: AggStatProps) {
  return (
    <div>
      <div style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.18em', color: C.muted2, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontFamily: F.syne, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {unit && <span style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>{unit}</span>}
      </div>
    </div>
  )
}

function sessionTopValue(s: ExerciseHistorySession): number {
  const tops = s.sets.map(set => Number(set.weight) || 0)
  const top = Math.max(...tops, 0)
  if (top > 0) return top
  const reps = s.sets.map(set => Number(set.reps) || 0)
  return Math.max(...reps, 0)
}

export function HistorySheet({ exerciseName, history, onClose }: HistorySheetProps) {
  if (!history) return null
  const topValues = history.slice().reverse().map(sessionTopValue)
  const allSetCount = history.reduce((a, s) => a + s.sets.length, 0)
  const totalVolume = history.reduce((a, s) =>
    a + s.sets.reduce((b, x) => b + (Number(x.reps) || 0) * (Number(x.weight) || 0), 0), 0)

  return (
    <Sheet open onClose={onClose} title={exerciseName}>
      <div style={{ padding: '20px 24px 28px' }}>
        {/* Hero */}
        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.2em', color: C.muted, marginBottom: 6 }}>
          HISTORY · LAST {history.length} SESSION{history.length === 1 ? '' : 'S'}
        </div>
        <div style={{
          padding: '14px 0',
          borderBottom: `1px solid ${C.hair}`,
          marginBottom: 18,
        }}>
          <Sparkline values={topValues} w={300} h={56} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: F.mono, fontSize: 9, color: C.muted2, letterSpacing: '0.14em' }}>
              {history[history.length - 1].date.toUpperCase()}
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 9, color: C.muted2, letterSpacing: '0.14em' }}>
              {history[0].date.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Aggregate stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
          <AggStat label="SESSIONS" value={history.length} />
          <AggStat label="TOTAL SETS" value={allSetCount} />
          <AggStat
            label="VOLUME"
            value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : '—'}
            unit={totalVolume > 0 ? 'lb' : undefined}
          />
        </div>

        {/* Session log */}
        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.2em', color: C.muted, marginBottom: 10 }}>
          SESSION LOG
        </div>
        {history.map((s, i) => (
          <div
            key={`${s.workoutId}-${i}`}
            style={{
              padding: '12px 0',
              borderBottom: i === history.length - 1 ? 'none' : `1px solid ${C.hair}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontFamily: F.syne, fontSize: 14, fontWeight: 700, color: C.text }}>
                {s.date}
              </span>
              <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.14em', color: C.muted }}>
                {s.relative.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {s.sets.map((set, j) => {
                const w = Number(set.weight) || 0
                const reps = set.reps ?? '?'
                const txt = w > 0 ? `${reps}×${w}` : `${reps}`
                const rpe = set.rpe
                return (
                  <span
                    key={j}
                    style={{
                      fontFamily: F.mono,
                      fontSize: 11, color: C.text, fontWeight: 500,
                      padding: '4px 7px', borderRadius: 4,
                      background: C.surfaceInput, border: `1px solid ${C.hair}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {txt}
                    {rpe && <span style={{ color: C.muted2, marginLeft: 4 }}>· {rpe}</span>}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
