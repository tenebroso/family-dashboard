import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import dayjs from 'dayjs'
import { C, F } from '../tokens'
import { TopBar } from '../components/TopBar'
import { IconBtn } from '../components/IconBtn'
import { PrimaryBtn } from '../components/PrimaryBtn'
import { BigField } from '../components/BigField'
import { TimeField, mmssToSeconds, secondsToMmss } from '../components/TimeField'
import { RPEStrip } from '../components/RPEStrip'
import { ChevronIcon } from '../icons'
import { GET_RUN_WORKOUT, LOG_RUN_WORKOUT, UNCOMPLETE_WORKOUT } from '../graphql'
import type { WorkoutData } from '../types'

function hapticMedium() {
  if ('vibrate' in navigator) navigator.vibrate(30)
}

interface RunFormState {
  miles: string
  time: string
  avgHR: string
  maxHR: string
  rpe: string
  notes: string
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '0.2em', color: C.muted, marginBottom: 4, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontFamily: F.syne, fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export function RunWorkout() {
  const navigate = useNavigate()
  const { workoutId } = useParams<{ workoutId: string }>()

  const { data, loading } = useQuery<{ workout: WorkoutData | null }>(
    GET_RUN_WORKOUT,
    { variables: { id: workoutId }, fetchPolicy: 'cache-and-network', skip: !workoutId }
  )

  const [logRun, { loading: submitting }] = useMutation(LOG_RUN_WORKOUT)
  const [uncompleteWorkoutMutation] = useMutation(UNCOMPLETE_WORKOUT)

  const workout = data?.workout
  const run = workout?.runWorkout
  const isCompleted = run?.completed ?? false
  const [isEditing, setIsEditing] = useState(false)
  const isView = isCompleted && !isEditing

  const [form, setForm] = useState<RunFormState>({
    miles: run?.actualMiles != null ? String(run.actualMiles) : '',
    time: run?.actualTime ? secondsToMmss(run.actualTime) : '',
    avgHR: run?.avgHeartRate != null ? String(run.avgHeartRate) : '',
    maxHR: run?.maxHeartRate != null ? String(run.maxHeartRate) : '',
    rpe: run?.actualRPE != null ? String(run.actualRPE) : '',
    notes: run?.notes ?? '',
  })

  // Sync form when data loads or completion status changes
  useEffect(() => {
    if (run) {
      setForm({
        miles: run.actualMiles != null ? String(run.actualMiles) : '',
        time: run.actualTime ? secondsToMmss(run.actualTime) : '',
        avgHR: run.avgHeartRate != null ? String(run.avgHeartRate) : '',
        maxHR: run.maxHeartRate != null ? String(run.maxHeartRate) : '',
        rpe: run.actualRPE != null ? String(run.actualRPE) : '',
        notes: run.notes ?? '',
      })
      setIsEditing(false)
    }
  }, [run?.id, run?.completed]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (k: keyof RunFormState) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid = !!(form.miles && form.time)

  const handleUncomplete = async () => {
    if (!workout) return
    try {
      await uncompleteWorkoutMutation({
        variables: { workoutId: workout.id },
        refetchQueries: ['GetTrainingWeekCalendar', 'GetRunWorkout'],
      })
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async () => {
    if (!valid || !run || submitting) return
    hapticMedium()
    try {
      await logRun({
        variables: {
          workoutId: workout!.id,
          actualMiles: parseFloat(form.miles),
          actualTime: mmssToSeconds(form.time),
          avgHeartRate: form.avgHR ? parseInt(form.avgHR) : undefined,
          maxHeartRate: form.maxHR ? parseInt(form.maxHR) : undefined,
          actualRPE: form.rpe ? parseInt(form.rpe) : undefined,
          notes: form.notes || undefined,
        },
        refetchQueries: ['GetTrainingWeekCalendar', 'GetRunWorkout'],
      })
      if (!isEditing) navigate(-1)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading && !data) {
    return (
      <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          title="Run"
          left={<IconBtn onClick={() => navigate(-1)}><ChevronIcon dir="left" /></IconBtn>}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em', color: C.muted }}>LOADING…</div>
        </div>
      </div>
    )
  }

  const dateLabel = workout ? dayjs(workout.date).format('ddd · MMM D').toUpperCase() : ''

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        eyebrow={dateLabel}
        title={workout?.notes?.split('\n')[0] || 'Run'}
        left={
          <IconBtn onClick={() => navigate(-1)}>
            <ChevronIcon dir="left" />
          </IconBtn>
        }
      />

      <div className="wk-noscroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 120 }}>
        {/* Prescribed targets banner */}
        {run && (run.targetMiles || run.targetPace || run.heartRateZone) && (
          <div style={{ padding: '20px 24px 24px', borderBottom: `1px solid ${C.hair}` }}>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.2em', color: C.muted, marginBottom: 14 }}>
              PRESCRIBED
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {run.targetMiles && <Stat label="DISTANCE" value={String(run.targetMiles)} unit="mi" />}
              {run.targetPace && <Stat label="PACE" value={run.targetPace.replace('/mi', '')} unit="/mi" />}
              {run.heartRateZone && <Stat label="ZONE" value={run.heartRateZone.replace('Zone ', '')} />}
            </div>
          </div>
        )}

        {/* Editorial heading */}
        <div style={{ padding: '28px 24px 18px' }}>
          <div style={{ fontFamily: F.syne, fontSize: 36, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em', color: C.text }}>
            {isView ? 'How it went' : 'Log your run'}
          </div>
          <div style={{ fontFamily: F.dm, fontSize: 13, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
            {isView
              ? 'Your completed run.'
              : 'Enter what you actually did. Distance and time are required.'}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 32 }}>
          <BigField
            label="DISTANCE"
            unit="mi"
            value={form.miles}
            onChange={update('miles')}
            placeholder="0.00"
            disabled={isView}
            inputMode="decimal"
          />

          <TimeField
            label="TIME"
            value={form.time}
            onChange={update('time')}
            disabled={isView}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <BigField
              label="AVG HR"
              unit="bpm"
              value={form.avgHR}
              onChange={update('avgHR')}
              placeholder="—"
              disabled={isView}
              small
              inputMode="numeric"
            />
            <BigField
              label="MAX HR"
              unit="bpm"
              value={form.maxHR}
              onChange={update('maxHR')}
              placeholder="—"
              disabled={isView}
              small
              inputMode="numeric"
            />
          </div>

          <RPEStrip value={form.rpe} onChange={update('rpe')} disabled={isView} />

          <div>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.2em', color: C.muted, marginBottom: 8 }}>
              NOTES
            </div>
            <textarea
              value={form.notes}
              onChange={e => update('notes')(e.target.value)}
              disabled={isView}
              placeholder="How did it feel?"
              className="wk-input-reset"
              style={{
                width: '100%',
                minHeight: 70,
                resize: 'none',
                background: isView ? 'transparent' : C.surfaceInput,
                border: `1px solid ${isView ? 'transparent' : C.hair}`,
                borderRadius: 10,
                padding: 12,
                color: C.text,
                fontFamily: F.dm,
                fontSize: 13,
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        padding: '12px 20px',
        paddingBottom: 'max(44px, env(safe-area-inset-bottom, 44px))',
        background: `linear-gradient(180deg, rgba(14,14,12,0) 0%, rgba(14,14,12,0.92) 28%, ${C.bg} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {isView ? (
          <>
            <PrimaryBtn onClick={() => setIsEditing(true)}>Edit Run</PrimaryBtn>
            <PrimaryBtn variant="outline" onClick={handleUncomplete}>Mark Incomplete</PrimaryBtn>
          </>
        ) : (
          <>
            {isEditing && (
              <PrimaryBtn variant="outline" onClick={() => setIsEditing(false)}>Cancel</PrimaryBtn>
            )}
            <PrimaryBtn disabled={!valid || submitting} onClick={handleSubmit}>
              {submitting ? 'Saving…' : isEditing ? 'Save Changes' : valid ? 'Log Run' : 'Distance & Time required'}
            </PrimaryBtn>
          </>
        )}
      </div>
    </div>
  )
}
