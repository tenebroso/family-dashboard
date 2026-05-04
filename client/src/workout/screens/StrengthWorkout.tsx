import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import dayjs from 'dayjs'
import { C, F } from '../tokens'
import { TopBar } from '../components/TopBar'
import { IconBtn } from '../components/IconBtn'
import { Sheet } from '../components/Sheet'
import { PrimaryBtn } from '../components/PrimaryBtn'
import { PillInput } from '../components/PillInput'
import { ExerciseHistoryStrip } from '../components/ExerciseHistoryStrip'
import { SetHistoryHint } from '../components/SetHistoryHint'
import { HistorySheet } from '../components/HistorySheet'
import { ChevronIcon, PencilIcon, PlusIcon, TrashIcon } from '../icons'
import {
  GET_STRENGTH_WORKOUT,
  GET_WORKOUT_EXERCISE_HISTORY,
  LOG_SET,
  COMPLETE_SET,
  COMPLETE_WORKOUT,
  UNCOMPLETE_WORKOUT,
  UPDATE_EXERCISE,
  UPDATE_SET_TARGETS,
  ADD_SET,
  DELETE_SET,
} from '../graphql'
import type {
  WorkoutData,
  ExerciseData,
  StrengthSetData,
  LocalSetState,
  ExerciseHistory,
  ExerciseHistorySession,
  ExerciseHistorySet,
} from '../types'

function hapticLight() {
  if ('vibrate' in navigator) navigator.vibrate(10)
}
function hapticMedium() {
  if ('vibrate' in navigator) navigator.vibrate(30)
}

function groupBySection(exercises: ExerciseData[]): Array<{ name: string; exercises: ExerciseData[] }> {
  const map = new Map<string, ExerciseData[]>()
  for (const ex of [...exercises].sort((a, b) => a.order - b.order)) {
    if (!map.has(ex.section)) map.set(ex.section, [])
    map.get(ex.section)!.push(ex)
  }
  return Array.from(map.entries()).map(([name, exercises]) => ({ name, exercises }))
}

function initLocalSets(exercises: ExerciseData[]): Map<string, LocalSetState> {
  const m = new Map<string, LocalSetState>()
  for (const ex of exercises) {
    for (const s of ex.sets) {
      m.set(s.id, {
        actualReps: s.actualReps ?? '',
        actualWeight: s.actualWeight != null ? String(s.actualWeight) : '',
        actualRPE: s.actualRPE ?? '',
        notes: s.notes ?? '',
        completed: s.completed,
      })
    }
  }
  return m
}

// ─── Spec (target display / edit) ────────────────────────────────────────────

interface SpecProps {
  label: string
  value: string | null | undefined
  editMode: boolean
  onEdit?: (v: string) => void
}

function Spec({ label, value, editMode, onEdit }: SpecProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  if (editMode && editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.16em', color: C.muted2, fontWeight: 500 }}>{label}</span>
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { setEditing(false); onEdit?.(draft) }}
          onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onEdit?.(draft) } }}
          className="wk-input-reset"
          style={{
            width: 52,
            height: 28,
            borderRadius: 4,
            background: C.surfaceInput,
            border: `1px solid ${C.gold}`,
            color: C.text,
            fontFamily: F.mono,
            fontSize: 16,
            fontWeight: 500,
            textAlign: 'center',
            padding: '0 4px',
          }}
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => editMode && setEditing(true)}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 5,
        borderBottom: editMode ? `1px dashed ${C.gold}` : 'none',
        paddingBottom: editMode ? 1 : 0,
        cursor: editMode ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.16em', color: C.muted2, fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 12, color: C.text, fontWeight: 500 }}>
        {value || '—'}
      </span>
    </div>
  )
}

// ─── Set Row ─────────────────────────────────────────────────────────────────

interface SetRowProps {
  set: StrengthSetData
  local: LocalSetState
  editMode: boolean
  matchedSet: ExerciseHistorySet | null
  lastRelative: string | null
  onUpdateLocal: (patch: Partial<LocalSetState>) => void
  onComplete: () => void
  onUpdateTargets: (field: string, value: string) => void
  onDelete: () => void
  scheduleLogSet: (setId: string, local: LocalSetState) => void
}

function SetRow({ set, local, editMode, matchedSet, lastRelative, onUpdateLocal, onComplete, onUpdateTargets, onDelete, scheduleLogSet }: SetRowProps) {
  return (
    <div style={{
      borderRadius: 12,
      background: local.completed ? 'rgba(255,74,28,0.04)' : C.surfaceSet,
      border: `1px ${editMode ? 'dashed' : 'solid'} ${local.completed ? 'rgba(255,74,28,0.18)' : C.hair}`,
      padding: '12px 12px 12px 14px',
      transition: 'background 0.2s',
      position: 'relative',
    }}>
      {/* Top row: target prescription */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          fontFamily: F.mono,
          fontSize: 9,
          letterSpacing: '0.14em',
          fontWeight: 500,
          color: C.gold,
          padding: '3px 6px',
          background: 'rgba(255,74,28,0.1)',
          borderRadius: 3,
          flexShrink: 0,
        }}>
          SET {set.setNumber}
        </div>
        <div style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Spec
            label="REPS"
            value={set.targetReps}
            editMode={editMode}
            onEdit={v => onUpdateTargets('targetReps', v)}
          />
          <Spec
            label="LBS"
            value={set.targetWeight != null ? String(set.targetWeight) : null}
            editMode={editMode}
            onEdit={v => onUpdateTargets('targetWeight', v)}
          />
          <Spec
            label="RPE"
            value={set.targetRPE}
            editMode={editMode}
            onEdit={v => onUpdateTargets('targetRPE', v)}
          />
          {(set.tempo || editMode) && (
            <Spec
              label="TEMPO"
              value={set.tempo}
              editMode={editMode}
              onEdit={v => onUpdateTargets('tempo', v)}
            />
          )}
        </div>
        {editMode && (
          <button
            onClick={onDelete}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.rust,
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <TrashIcon size={14} color={C.muted2} />
          </button>
        )}
      </div>

      {/* Inline last-time hint */}
      <SetHistoryHint matchedSet={matchedSet} relative={lastRelative} />

      {/* Bottom row: actuals */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <PillInput
            value={local.actualReps}
            onChange={v => {
              const next = { ...local, actualReps: v }
              onUpdateLocal({ actualReps: v })
              scheduleLogSet(set.id, next)
            }}
            placeholder="—"
            width={62}
            disabled={local.completed}
            inputMode="numeric"
          />
          <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.18em', color: C.muted2, fontWeight: 500 }}>REPS</span>
        </div>

        <span style={{ fontFamily: F.mono, color: C.muted2, fontSize: 11, paddingBottom: 20 }}>×</span>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <PillInput
            value={local.actualWeight}
            onChange={v => {
              const next = { ...local, actualWeight: v }
              onUpdateLocal({ actualWeight: v })
              scheduleLogSet(set.id, next)
            }}
            placeholder="—"
            width={68}
            disabled={local.completed}
            inputMode="decimal"
          />
          <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.18em', color: C.muted2, fontWeight: 500 }}>LBS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <PillInput
            value={local.actualRPE}
            onChange={v => {
              const next = { ...local, actualRPE: v }
              onUpdateLocal({ actualRPE: v })
              scheduleLogSet(set.id, next)
            }}
            placeholder="—"
            width={50}
            disabled={local.completed}
            inputMode="numeric"
          />
          <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.18em', color: C.muted2, fontWeight: 500 }}>RPE</span>
        </div>

        {/* Complete button */}
        <button
          onClick={onComplete}
          style={{
            marginLeft: 'auto',
            width: 44,
            height: 44,
            borderRadius: 12,
            background: local.completed ? C.gold : 'transparent',
            border: `1.5px solid ${local.completed ? C.gold : C.hairStrong}`,
            color: local.completed ? C.bg : C.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {local.notes && (
        <div style={{ marginTop: 8, paddingLeft: 2, fontFamily: F.dm, fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
          "{local.notes}"
        </div>
      )}
    </div>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: ExerciseData
  editMode: boolean
  localSets: Map<string, LocalSetState>
  history: ExerciseHistorySession[]
  onOpenHistory: () => void
  onUpdateLocal: (setId: string, patch: Partial<LocalSetState>) => void
  onComplete: (setId: string) => void
  onUpdateTargets: (setId: string, field: string, value: string) => void
  onDeleteSet: (setId: string) => void
  onAddSet: (exerciseId: string) => void
  onTapName: () => void
  scheduleLogSet: (setId: string, local: LocalSetState) => void
}

function ExerciseCard({
  exercise, editMode, localSets, history, onOpenHistory, onUpdateLocal, onComplete,
  onUpdateTargets, onDeleteSet, onAddSet, onTapName, scheduleLogSet,
}: ExerciseCardProps) {
  const todayTopWeight = exercise.sets.reduce((a, s) => Math.max(a, s.targetWeight ?? 0), 0)
  const lastSession = history[0] ?? null
  const lastRelative = lastSession?.relative ?? null

  return (
    <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.hair}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <div
          onClick={onTapName}
          style={{
            cursor: editMode ? 'pointer' : 'default',
            borderBottom: editMode ? `1px dashed ${C.gold}` : 'none',
            paddingBottom: editMode ? 2 : 0,
            flex: 1,
            marginRight: 12,
          }}
        >
          <div style={{ fontFamily: F.syne, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {exercise.name}
          </div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.16em', color: C.muted, flexShrink: 0 }}>
          {exercise.sets.length} {exercise.sets.length === 1 ? 'SET' : 'SETS'}
        </div>
      </div>

      {/* Coach notes */}
      {exercise.coachNotes && (
        <div style={{
          marginTop: 10,
          padding: '8px 10px',
          borderRadius: 8,
          background: 'rgba(255,74,28,0.06)',
          border: `1px solid ${C.hair}`,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', color: C.gold, fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
            COACH
          </span>
          <span style={{ fontFamily: F.dm, fontSize: 12, color: C.text, lineHeight: 1.45 }}>
            {exercise.coachNotes}
          </span>
        </div>
      )}

      {/* History strip */}
      <ExerciseHistoryStrip history={history} todayTopWeight={todayTopWeight} onOpen={onOpenHistory} />

      {/* Sets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        {exercise.sets.map(set => {
          const local = localSets.get(set.id) ?? {
            actualReps: set.actualReps ?? '',
            actualWeight: set.actualWeight != null ? String(set.actualWeight) : '',
            actualRPE: set.actualRPE ?? '',
            notes: set.notes ?? '',
            completed: set.completed,
          }
          const matched = lastSession?.sets.find(s => s.setNumber === set.setNumber) ?? null
          return (
            <SetRow
              key={set.id}
              set={set}
              local={local}
              editMode={editMode}
              matchedSet={matched}
              lastRelative={lastRelative}
              onUpdateLocal={patch => onUpdateLocal(set.id, patch)}
              onComplete={() => onComplete(set.id)}
              onUpdateTargets={(field, value) => onUpdateTargets(set.id, field, value)}
              onDelete={() => onDeleteSet(set.id)}
              scheduleLogSet={scheduleLogSet}
            />
          )
        })}
      </div>

      {/* Loading note */}
      {exercise.loadingNote && (
        <div style={{
          marginTop: 14,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(255,74,28,0.05)',
          border: `1px solid rgba(255,74,28,0.12)`,
        }}>
          <div style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.18em', color: C.goldDim, marginBottom: 5, fontWeight: 500 }}>
            LOADING NOTE
          </div>
          <div style={{ fontFamily: F.dm, fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
            {exercise.loadingNote}
          </div>
        </div>
      )}

      {/* Add Set */}
      {editMode && (
        <button
          onClick={() => onAddSet(exercise.id)}
          style={{
            marginTop: 12,
            width: '100%',
            height: 38,
            background: 'transparent',
            border: `1px dashed ${C.hair}`,
            borderRadius: 10,
            color: C.muted,
            fontFamily: F.mono,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <PlusIcon size={12} color={C.muted} /> Add Set
        </button>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function StrengthWorkout() {
  const navigate = useNavigate()
  const { workoutId } = useParams<{ workoutId: string }>()

  const { data, loading, refetch } = useQuery<{ workout: WorkoutData | null }>(
    GET_STRENGTH_WORKOUT,
    { variables: { id: workoutId }, fetchPolicy: 'cache-and-network', skip: !workoutId }
  )

  const { data: histData } = useQuery<{ workoutExerciseHistory: ExerciseHistory[] }>(
    GET_WORKOUT_EXERCISE_HISTORY,
    { variables: { workoutId, limit: 6 }, skip: !workoutId, fetchPolicy: 'cache-and-network' }
  )

  const historyByName = useMemo(() => {
    const m = new Map<string, ExerciseHistorySession[]>()
    for (const h of histData?.workoutExerciseHistory ?? []) {
      m.set(h.exerciseName.toLowerCase(), h.sessions)
    }
    return m
  }, [histData])

  const [historyFor, setHistoryFor] = useState<string | null>(null)

  const [logSet] = useMutation(LOG_SET)
  const [completeSetMutation] = useMutation(COMPLETE_SET)
  const [completeWorkoutMutation] = useMutation(COMPLETE_WORKOUT)
  const [uncompleteWorkoutMutation] = useMutation(UNCOMPLETE_WORKOUT)
  const [updateExerciseMutation] = useMutation(UPDATE_EXERCISE)
  const [updateSetTargetsMutation] = useMutation(UPDATE_SET_TARGETS)
  const [addSetMutation] = useMutation<{ addSet: StrengthSetData }>(ADD_SET)
  const [deleteSetMutation] = useMutation(DELETE_SET)

  const [editMode, setEditMode] = useState(false)
  const [localSets, setLocalSets] = useState<Map<string, LocalSetState>>(new Map())
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<{ id: string; name: string } | null>(null)
  const [exerciseNameDraft, setExerciseNameDraft] = useState('')

  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const workout = data?.workout
  const sections = workout ? groupBySection(workout.exercises) : []
  const allSets = workout?.exercises.flatMap(e => e.sets) ?? []
  const totalSets = allSets.length
  const doneSets = allSets.filter(s => localSets.get(s.id)?.completed ?? s.completed).length
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0

  // Initialize local state when data first loads
  useEffect(() => {
    if (workout) {
      setLocalSets(initLocalSets(workout.exercises))
      setWorkoutNotes(workout.notes ?? '')
    }
  }, [workout?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleLogSet = useCallback((setId: string, local: LocalSetState) => {
    const existing = debounceRef.current.get(setId)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(async () => {
      try {
        await logSet({
          variables: {
            setId,
            actualReps: local.actualReps || undefined,
            actualWeight: local.actualWeight ? parseFloat(local.actualWeight) : undefined,
            actualRPE: local.actualRPE || undefined,
            notes: local.notes || undefined,
          },
        })
      } catch (e) { console.error(e) }
      debounceRef.current.delete(setId)
    }, 500)
    debounceRef.current.set(setId, timer)
  }, [logSet])

  const flushLogSet = useCallback(async (setId: string, local: LocalSetState) => {
    const existing = debounceRef.current.get(setId)
    if (existing) { clearTimeout(existing); debounceRef.current.delete(setId) }
    try {
      await logSet({
        variables: {
          setId,
          actualReps: local.actualReps || undefined,
          actualWeight: local.actualWeight ? parseFloat(local.actualWeight) : undefined,
          actualRPE: local.actualRPE || undefined,
          notes: local.notes || undefined,
        },
      })
    } catch (e) { console.error(e) }
  }, [logSet])

  const handleUpdateLocal = (setId: string, patch: Partial<LocalSetState>) => {
    setLocalSets(m => {
      const next = new Map(m)
      const prev = next.get(setId)
      if (prev) next.set(setId, { ...prev, ...patch })
      return next
    })
  }

  const handleComplete = async (setId: string) => {
    const local = localSets.get(setId)
    if (!local || local.completed) return
    hapticLight()
    // Flush pending actuals first
    if (local) await flushLogSet(setId, local)
    // Optimistic update
    setLocalSets(m => { const n = new Map(m); const p = n.get(setId); if (p) n.set(setId, { ...p, completed: true }); return n })
    try {
      await completeSetMutation({ variables: { setId } })
    } catch (e) {
      // Rollback
      setLocalSets(m => { const n = new Map(m); const p = n.get(setId); if (p) n.set(setId, { ...p, completed: false }); return n })
      console.error(e)
    }
  }

  const handleUpdateTargets = async (setId: string, field: string, value: string) => {
    const vars: Record<string, unknown> = { id: setId }
    if (field === 'targetWeight') vars.targetWeight = parseFloat(value) || null
    else vars[field] = value || null
    try {
      await updateSetTargetsMutation({ variables: vars })
      await refetch()
    } catch (e) { console.error(e) }
  }

  const handleDeleteSet = async (setId: string) => {
    try {
      await deleteSetMutation({ variables: { id: setId } })
      await refetch()
    } catch (e) { console.error(e) }
  }

  const handleAddSet = async (exerciseId: string) => {
    try {
      const res = await addSetMutation({ variables: { exerciseId } })
      if (res?.data?.addSet) {
        const newSet = res.data.addSet
        setLocalSets(m => {
          const n = new Map(m)
          n.set(newSet.id, { actualReps: '', actualWeight: '', actualRPE: '', notes: '', completed: false })
          return n
        })
        await refetch()
      }
    } catch (e) { console.error(e) }
  }

  const handleSaveExerciseName = async () => {
    if (!editingExercise) return
    try {
      await updateExerciseMutation({ variables: { id: editingExercise.id, name: exerciseNameDraft } })
      await refetch()
      setEditingExercise(null)
    } catch (e) { console.error(e) }
  }

  const handleMarkComplete = async () => {
    hapticMedium()
    try {
      await completeWorkoutMutation({
        variables: { workoutId },
        refetchQueries: ['GetTrainingWeekCalendar'],
      })
      window.history.length > 1 ? navigate(-1) : navigate('/workout')
    } catch (e) { console.error(e) }
    setConfirmOpen(false)
  }

  const handleMarkIncomplete = async () => {
    hapticLight()
    try {
      await uncompleteWorkoutMutation({
        variables: { workoutId },
        refetchQueries: ['GetTrainingWeekCalendar', 'GetStrengthWorkout'],
      })
    } catch (e) { console.error(e) }
  }

  const editBg = '#FFF1ED'

  if (loading && !data) {
    return (
      <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          title="Strength"
          left={<IconBtn onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/workout')}><ChevronIcon dir="left" /></IconBtn>}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em', color: C.muted }}>LOADING…</div>
        </div>
      </div>
    )
  }

  const isComplete = !!workout?.completedAt
  const dateLabel = workout ? dayjs(workout.date).format('ddd · MMM D').toUpperCase() : ''

  return (
    <div style={{ minHeight: '100dvh', background: editMode ? editBg : C.bg, display: 'flex', flexDirection: 'column', transition: 'background 0.2s' }}>
      <TopBar
        eyebrow={dateLabel}
        title={workout?.notes?.split('\n')[0] || 'Strength'}
        bg={editMode ? editBg : C.bg}
        left={
          <IconBtn onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/workout')}>
            <ChevronIcon dir="left" />
          </IconBtn>
        }
        right={
          !isComplete ? (
            <IconBtn active={editMode} onClick={() => setEditMode(e => !e)}>
              <PencilIcon size={15} />
            </IconBtn>
          ) : undefined
        }
      />

      {/* Edit-mode banner */}
      {editMode && (
        <div style={{
          padding: '10px 20px',
          background: 'rgba(255,74,28,0.08)',
          borderBottom: `1px dashed ${C.gold}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.16em', color: C.gold, fontWeight: 500 }}>
            EDITING PLAN — TAP TARGETS TO REVISE
          </div>
        </div>
      )}

      {/* Progress strip */}
      {!editMode && !isComplete && (
        <div style={{
          padding: '14px 24px 10px',
          borderBottom: `1px solid ${C.hair}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: F.syne, fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1, flexShrink: 0 }}>
            {doneSets}
            <span style={{ color: C.muted2, fontSize: 22 }}>/{totalSets}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', color: C.muted, marginBottom: 4 }}>
              SETS LOGGED
            </div>
            <div style={{ height: 3, background: '#E5DECB', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: C.gold, transition: 'width 0.4s ease', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      )}

      {isComplete && (
        <div style={{
          padding: '10px 20px',
          background: 'rgba(255,74,28,0.06)',
          borderBottom: `1px solid ${C.hair}`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em', color: C.gold }}>✓ WORKOUT COMPLETE</span>
          <button
            onClick={handleMarkIncomplete}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: F.mono,
              fontSize: 9,
              letterSpacing: '0.14em',
              color: C.muted,
              cursor: 'pointer',
              padding: '4px 0',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            MARK INCOMPLETE
          </button>
        </div>
      )}

      {/* Scrollable body */}
      <div
        className="wk-noscroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 110,
          background: editMode ? `linear-gradient(180deg, rgba(255,74,28,0.02) 0%, transparent 200px)` : undefined,
        }}
      >
        {/* Workout notes */}
        <div style={{ padding: '16px 20px 8px' }}>
          <textarea
            value={workoutNotes}
            onChange={e => setWorkoutNotes(e.target.value)}
            placeholder="Add a note for this workout…"
            rows={1}
            className="wk-input-reset"
            style={{
              width: '100%',
              minHeight: 36,
              resize: 'none',
              background: 'transparent',
              border: 'none',
              color: C.text,
              fontFamily: F.dm,
              fontSize: 13,
              fontStyle: workoutNotes ? 'normal' : 'italic',
              padding: '6px 0',
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Sections */}
        {sections.map((section, sIdx) => (
          <div key={section.name}>
            {/* Sticky section header */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              background: editMode ? '#FFF1ED' : C.bg,
              padding: '14px 20px 8px',
              borderTop: `1px solid ${C.hair}`,
              borderBottom: `1px solid ${C.hair}`,
              transition: 'background 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: C.gold, letterSpacing: '0.2em', fontWeight: 500 }}>
                  {String(sIdx + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: F.syne, fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {section.name}
                </span>
                <span style={{ flex: 1, height: 1, background: C.hair, marginLeft: 4 }} />
              </div>
            </div>

            {section.exercises.map(ex => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                editMode={editMode}
                localSets={localSets}
                history={historyByName.get(ex.name.toLowerCase()) ?? []}
                onOpenHistory={() => setHistoryFor(ex.name)}
                onUpdateLocal={handleUpdateLocal}
                onComplete={handleComplete}
                onUpdateTargets={handleUpdateTargets}
                onDeleteSet={handleDeleteSet}
                onAddSet={handleAddSet}
                onTapName={() => {
                  setEditingExercise({ id: ex.id, name: ex.name })
                  setExerciseNameDraft(ex.name)
                }}
                scheduleLogSet={scheduleLogSet}
              />
            ))}
          </div>
        ))}

        {!workout && (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em', color: C.muted }}>
            WORKOUT NOT FOUND
          </div>
        )}
      </div>

      {/* Sticky footer */}
      {!isComplete && workout && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: '12px 20px',
          paddingBottom: 'max(44px, env(safe-area-inset-bottom, 44px))',
          background: `linear-gradient(180deg, rgba(244,240,232,0) 0%, rgba(244,240,232,0.92) 30%, ${C.bg} 100%)`,
        }}>
          <PrimaryBtn
            variant={doneSets === totalSets ? 'gold' : 'outline'}
            onClick={() => setConfirmOpen(true)}
          >
            {doneSets === totalSets
              ? 'Mark Workout Complete'
              : `Finish — ${totalSets - doneSets} set${totalSets - doneSets !== 1 ? 's' : ''} remaining`}
          </PrimaryBtn>
        </div>
      )}

      {/* Confirm complete sheet */}
      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Mark workout complete?">
        <div style={{ padding: '20px 24px 28px' }}>
          <div style={{ fontFamily: F.dm, fontSize: 14, color: C.muted, lineHeight: 1.5, marginBottom: 20 }}>
            {totalSets - doneSets > 0
              ? `${totalSets - doneSets} of ${totalSets} sets are still incomplete. You can come back and log them later.`
              : `All ${totalSets} sets logged. Nice work.`}
          </div>
          <PrimaryBtn onClick={handleMarkComplete}>Mark Complete</PrimaryBtn>
          <div style={{ height: 8 }} />
          <PrimaryBtn variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</PrimaryBtn>
        </div>
      </Sheet>

      {/* Edit exercise name sheet */}
      <Sheet open={!!editingExercise} onClose={() => setEditingExercise(null)} title="Edit Exercise">
        {editingExercise && (
          <div style={{ padding: '20px 24px 28px' }}>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.2em', color: C.muted, marginBottom: 8 }}>
              EXERCISE NAME
            </div>
            <input
              autoFocus
              value={exerciseNameDraft}
              onChange={e => setExerciseNameDraft(e.target.value)}
              className="wk-input-reset"
              style={{
                width: '100%',
                height: 50,
                borderRadius: 10,
                background: C.surfaceInput,
                border: `1px solid ${C.hair}`,
                color: C.text,
                padding: '0 14px',
                fontSize: 16,
                fontFamily: F.dm,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              <PrimaryBtn variant="outline" onClick={() => setEditingExercise(null)}>Cancel</PrimaryBtn>
              <PrimaryBtn onClick={handleSaveExerciseName}>Save</PrimaryBtn>
            </div>
          </div>
        )}
      </Sheet>

      {/* History sheet */}
      {historyFor && (
        <HistorySheet
          exerciseName={historyFor}
          history={historyByName.get(historyFor.toLowerCase()) ?? []}
          onClose={() => setHistoryFor(null)}
        />
      )}
    </div>
  )
}
