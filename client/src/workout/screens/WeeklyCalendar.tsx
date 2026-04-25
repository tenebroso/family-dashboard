import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import dayjs from 'dayjs'
import { C, F } from '../tokens'
import { TopBar } from '../components/TopBar'
import { IconBtn } from '../components/IconBtn'
import { Sheet } from '../components/Sheet'
import { TypeBadge } from '../components/TypeBadge'
import { CompletionRing } from '../components/CompletionRing'
import { PrimaryBtn } from '../components/PrimaryBtn'
import { BigField } from '../components/BigField'
import {
  ChevronIcon,
  PlusIcon,
  LiftIcon,
  RunIcon,
  RestIcon,
} from '../icons'
import { GET_TRAINING_WEEK, CREATE_RUN_WORKOUT, CREATE_RECOVERY_WORKOUT } from '../graphql'
import type { WorkoutData, DayTile } from '../types'

function currentMonday(): string {
  const today = dayjs()
  const dow = today.day()
  const daysBack = dow === 0 ? 6 : dow - 1
  return today.subtract(daysBack, 'day').format('YYYY-MM-DD')
}

function buildDayTiles(weekOf: string, workouts: WorkoutData[]): DayTile[] {
  const today = dayjs().format('YYYY-MM-DD')
  return Array.from({ length: 7 }, (_, i) => {
    const d = dayjs(weekOf).add(i, 'day')
    const date = d.format('YYYY-MM-DD')
    const workout = workouts.find(w => w.date === date) ?? null
    return {
      date,
      dayLabel: d.format('ddd').toUpperCase(),
      dayNum: d.date(),
      isToday: date === today,
      isPast: date < today,
      workout,
    }
  })
}

function workoutIsComplete(w: WorkoutData): boolean {
  return w.completedAt != null || (w.type === 'run' && (w.runWorkout?.completed ?? false))
}

function workoutIsInProgress(w: WorkoutData): boolean {
  if (workoutIsComplete(w)) return false
  if (w.type === 'strength') {
    return w.exercises.some(e => e.sets.some(s => s.completed))
  }
  if (w.type === 'run') {
    return !!(w.runWorkout?.actualMiles)
  }
  return false
}

function workoutMeta(w: WorkoutData): string {
  if (w.type === 'strength') {
    const exCount = w.exercises.length
    const setCount = w.exercises.reduce((sum, e) => sum + e.sets.length, 0)
    return `${exCount} EXERCISE${exCount !== 1 ? 'S' : ''} · ${setCount} SETS`
  }
  if (w.type === 'run') {
    const r = w.runWorkout
    if (!r) return ''
    const miles = r.actualMiles ?? r.targetMiles
    const pace = r.targetPace
    if (miles && pace) return `${miles} MI · ${pace} PACE`
    if (miles) return `${miles} MI`
    if (pace) return pace
    return ''
  }
  if (w.type === 'recovery') return 'MOBILITY · OPTIONAL'
  return ''
}

function workoutTitle(w: WorkoutData): string {
  if (w.notes) return w.notes.split('\n')[0].slice(0, 40)
  if (w.type === 'strength') return 'Strength'
  if (w.type === 'run') return w.runWorkout?.targetPace ? 'Run' : 'Run'
  if (w.type === 'recovery') return 'Recovery'
  return ''
}

function completionStats(tiles: DayTile[]) {
  let complete = 0, inProgress = 0, planned = 0
  for (const tile of tiles) {
    if (!tile.workout) continue
    if (workoutIsComplete(tile.workout)) complete++
    else if (workoutIsInProgress(tile.workout)) inProgress++
    else planned++
  }
  return { complete, inProgress, planned }
}

function hapticLight() {
  if ('vibrate' in navigator) navigator.vibrate(10)
}

interface ActionSheetState {
  date: string
  dayLabel: string
  weekOf: string
}

export function WeeklyCalendar() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const weekOf = searchParams.get('week') ?? currentMonday()
  const setWeekOf = (w: string) => setSearchParams({ week: w }, { replace: true })
  const [actionDay, setActionDay] = useState<ActionSheetState | null>(null)
  const [addRunOpen, setAddRunOpen] = useState(false)
  const [targetMiles, setTargetMiles] = useState('')
  const [targetPace, setTargetPace] = useState('')

  const { data, refetch } = useQuery<{ trainingWeek: { id: string; weekOf: string; workouts: WorkoutData[] } | null }>(
    GET_TRAINING_WEEK,
    { variables: { weekOf }, fetchPolicy: 'cache-and-network' }
  )

  const [createRun, { loading: creatingRun }] = useMutation<{ createRunWorkout: { id: string; date: string; type: string } }>(CREATE_RUN_WORKOUT)
  const [createRecovery] = useMutation(CREATE_RECOVERY_WORKOUT)

  const workouts = data?.trainingWeek?.workouts ?? []
  const tiles = buildDayTiles(weekOf, workouts)
  const { complete, inProgress, planned } = completionStats(tiles)
  const weekDisplay = dayjs(weekOf).format('MMMM D')

  const handleTileClick = (tile: DayTile) => {
    hapticLight()
    if (!tile.workout) {
      setActionDay({ date: tile.date, dayLabel: tile.dayLabel, weekOf })
    } else if (tile.workout.type === 'strength') {
      navigate(`/workout/strength/${tile.workout.id}`)
    } else if (tile.workout.type === 'run') {
      navigate(`/workout/run/${tile.workout.id}`)
    } else if (tile.workout.type === 'recovery') {
      navigate(`/workout/rest/${tile.workout.id}`)
    }
  }

  const handleAddRun = async () => {
    if (!actionDay) return
    try {
      const vars: Record<string, unknown> = { weekOf: actionDay.weekOf, date: actionDay.date }
      if (targetMiles) vars.targetMiles = parseFloat(targetMiles)
      if (targetPace) vars.targetPace = targetPace
      const res = await createRun({ variables: vars })
      setAddRunOpen(false)
      setActionDay(null)
      setTargetMiles('')
      setTargetPace('')
      await refetch()
      if (res?.data?.createRunWorkout?.id) {
        navigate(`/workout/run/${res.data.createRunWorkout.id}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkRest = async () => {
    if (!actionDay) return
    try {
      await createRecovery({ variables: { weekOf: actionDay.weekOf, date: actionDay.date } })
      setActionDay(null)
      await refetch()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        eyebrow="WORKOUT"
        title="Training Week"
        left={
          <IconBtn onClick={() => setWeekOf(dayjs(weekOf).subtract(7, 'day').format('YYYY-MM-DD'))}>
            <ChevronIcon dir="left" />
          </IconBtn>
        }
        right={
          <IconBtn onClick={() => setWeekOf(dayjs(weekOf).add(7, 'day').format('YYYY-MM-DD'))}>
            <ChevronIcon dir="right" />
          </IconBtn>
        }
      />

      <div className="wk-noscroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 80px' }}>
        {/* Week header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.2em', color: C.muted, marginBottom: 8 }}>
            WEEK OF
          </div>
          <div style={{ fontFamily: F.syne, fontSize: 44, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em', color: C.text }}>
            {weekDisplay}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 14, fontFamily: F.dm, fontSize: 12, color: C.muted }}>
            {complete > 0 && <span><span style={{ color: C.gold, fontWeight: 600 }}>{complete}</span> · complete</span>}
            {inProgress > 0 && <span><span style={{ color: C.text, fontWeight: 600 }}>{inProgress}</span> · in progress</span>}
            {planned > 0 && <span><span style={{ color: C.muted, fontWeight: 600 }}>{planned}</span> · planned</span>}
            {complete === 0 && inProgress === 0 && planned === 0 && (
              <span style={{ color: C.muted2 }}>No workouts this week</span>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: C.hair, marginBottom: 4 }} />

        {/* Day tiles */}
        {tiles.map(tile => {
          const w = tile.workout
          const complete = w ? workoutIsComplete(w) : false
          const inProg = w ? workoutIsInProgress(w) : false
          const ringState = complete ? 'complete' : inProg ? 'partial' : 'empty'
          const dimRow = tile.isPast && complete

          return (
            <div
              key={tile.date}
              onClick={() => handleTileClick(tile)}
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 16,
                padding: '20px 0',
                borderBottom: `1px solid ${C.hair}`,
                cursor: 'pointer',
                opacity: dimRow ? 0.65 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Date column */}
              <div style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  color: tile.isToday ? C.gold : C.muted,
                  fontWeight: 500,
                }}>
                  {tile.dayLabel}
                </div>
                <div style={{
                  fontFamily: F.syne,
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginTop: 2,
                  color: tile.isToday ? C.gold : C.text,
                }}>
                  {String(tile.dayNum).padStart(2, '0')}
                </div>
                {tile.isToday && (
                  <div style={{
                    fontFamily: F.mono,
                    fontSize: 8,
                    letterSpacing: '0.18em',
                    color: C.gold,
                    marginTop: 6,
                    fontWeight: 500,
                  }}>
                    TODAY
                  </div>
                )}
              </div>

              {/* Content column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                {!w ? (
                  <>
                    <div style={{ fontFamily: F.dm, fontSize: 14, color: C.muted2, fontStyle: 'italic' }}>No workout</div>
                    <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.16em', color: C.muted2, marginTop: 6 }}>
                      TAP TO ADD
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <TypeBadge type={w.type} />
                      {complete && (
                        <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', color: C.gold, fontWeight: 500 }}>
                          ✓ COMPLETE
                        </span>
                      )}
                      {inProg && (
                        <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', color: C.text, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span className="wk-pulse-gold" style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, display: 'inline-block' }} />
                          IN PROGRESS
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.syne, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.15 }}>
                      {workoutTitle(w)}
                    </div>
                    {workoutMeta(w) && (
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: '0.04em' }}>
                        {workoutMeta(w)}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 32 }}>
                {w ? (
                  <CompletionRing state={ringState} />
                ) : (
                  <PlusIcon color={C.muted2} size={18} />
                )}
              </div>
            </div>
          )
        })}

        {/* Footer note */}
        <div style={{ marginTop: 32, padding: 16, border: `1px dashed ${C.hair}`, borderRadius: 12 }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', color: C.muted, marginBottom: 6 }}>
            NOTE
          </div>
          <div style={{ fontFamily: F.dm, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            Lift days are imported from your training plan. You can add Run or Rest days manually.
          </div>
        </div>
      </div>

      {/* Empty-day action sheet */}
      <Sheet
        open={!!actionDay && !addRunOpen}
        onClose={() => setActionDay(null)}
        title={actionDay ? `${actionDay.dayLabel} · Add Workout` : undefined}
      >
        <div style={{ padding: '12px 16px 24px' }}>
          {[
            {
              label: 'Add Run',
              hint: null,
              icon: <RunIcon color={C.teal} size={16} />,
              disabled: false,
              onClick: () => setAddRunOpen(true),
            },
            {
              label: 'Add Lift',
              hint: 'IMPORTED FROM TRAINING PLAN',
              icon: <LiftIcon color={C.muted2} size={16} />,
              disabled: true,
              onClick: () => {},
            },
            {
              label: 'Mark Rest',
              hint: null,
              icon: <RestIcon color={C.muted} size={16} />,
              disabled: false,
              onClick: handleMarkRest,
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              disabled={item.disabled}
              style={{
                width: '100%',
                height: 60,
                borderRadius: 12,
                background: 'transparent',
                border: 'none',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                padding: '0 12px',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: item.disabled ? 0.5 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: C.surfaceInput,
                border: `1px solid ${C.hair}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontFamily: F.dm, fontSize: 15, color: C.text, fontWeight: 500 }}>{item.label}</div>
                {item.hint && (
                  <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.16em', color: C.muted2, marginTop: 2 }}>
                    {item.hint}
                  </div>
                )}
              </div>
              {!item.disabled && <ChevronIcon color={C.muted} />}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Add Run sheet */}
      <Sheet
        open={addRunOpen}
        onClose={() => { setAddRunOpen(false); setActionDay(null) }}
        title="Add Run"
      >
        <div style={{ padding: '16px 24px 28px' }}>
          <div style={{ fontFamily: F.dm, fontSize: 13, color: C.muted, marginBottom: 18, lineHeight: 1.5 }}>
            Both fields optional — skip targets and just log actuals after the run.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <BigField
              label="TARGET DISTANCE"
              unit="mi"
              value={targetMiles}
              onChange={setTargetMiles}
              placeholder="0.0"
              small
              inputMode="decimal"
            />
            <BigField
              label="TARGET PACE"
              unit="/mi"
              value={targetPace}
              onChange={setTargetPace}
              placeholder="—"
              small
              inputMode="text"
            />
          </div>
          <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
            <PrimaryBtn variant="outline" onClick={() => { setAddRunOpen(false); setActionDay(null) }}>
              Cancel
            </PrimaryBtn>
            <PrimaryBtn onClick={handleAddRun} disabled={creatingRun}>
              {creatingRun ? 'Creating…' : 'Create'}
            </PrimaryBtn>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
