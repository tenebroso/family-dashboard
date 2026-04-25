import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import dayjs from 'dayjs'

const GET_TRAINING_WEEK = gql`
  query GetTrainingWeek($weekOf: String!) {
    trainingWeek(weekOf: $weekOf) {
      id
      weekOf
      workouts {
        id
        date
        dayOfWeek
        type
        exercises {
          id
          name
          section
          order
          sets {
            id
            setNumber
            targetReps
            targetWeight
            targetRPE
            tempo
          }
        }
        runWorkout {
          id
          targetMiles
          targetPace
          heartRateZone
        }
        notes
      }
    }
  }
`

type StrengthSet = {
  id: string
  setNumber: number
  targetReps: string | null
  targetWeight: number | null
  targetRPE: string | null
  tempo: string | null
}

type Exercise = {
  id: string
  name: string
  section: string
  order: number
  sets: StrengthSet[]
}

type RunWorkout = {
  id: string
  targetMiles: number | null
  targetPace: string | null
  heartRateZone: string | null
}

type Workout = {
  id: string
  date: string
  dayOfWeek: number
  type: string
  exercises: Exercise[]
  runWorkout: RunWorkout | null
  notes: string | null
}

type TrainingWeek = {
  id: string
  weekOf: string
  workouts: Workout[]
}

function currentMonday(): string {
  const today = dayjs()
  const dow = today.day()
  const daysBack = dow === 0 ? 6 : dow - 1
  return today.subtract(daysBack, 'day').format('YYYY-MM-DD')
}

function formatWorkoutDate(dateStr: string): string {
  return dayjs(dateStr).format('dddd, MMMM D')
}

function groupBySection(exercises: Exercise[]): Map<string, Exercise[]> {
  const map = new Map<string, Exercise[]>()
  for (const ex of exercises) {
    if (!map.has(ex.section)) map.set(ex.section, [])
    map.get(ex.section)!.push(ex)
  }
  return map
}

function SetRow({ set }: { set: StrengthSet }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
      <td style={{ padding: '6px 8px', color: 'var(--ink-muted, #9A9488)', width: 40 }}>{set.setNumber}</td>
      <td style={{ padding: '6px 8px' }}>{set.targetReps ?? '—'}</td>
      <td style={{ padding: '6px 8px' }}>{set.targetWeight != null ? `${set.targetWeight} lbs` : '—'}</td>
      <td style={{ padding: '6px 8px' }}>{set.targetRPE ?? '—'}</td>
      <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 13 }}>{set.tempo ?? '—'}</td>
    </tr>
  )
}

function ExerciseBlock({ exercise }: { exercise: Exercise }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{exercise.name}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-muted, #9A9488)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {exercise.section}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
              <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--ink-muted, #9A9488)', fontSize: 11, fontWeight: 500, width: 40 }}>Set</th>
              <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--ink-muted, #9A9488)', fontSize: 11, fontWeight: 500 }}>Reps</th>
              <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--ink-muted, #9A9488)', fontSize: 11, fontWeight: 500 }}>Weight</th>
              <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--ink-muted, #9A9488)', fontSize: 11, fontWeight: 500 }}>RPE</th>
              <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--ink-muted, #9A9488)', fontSize: 11, fontWeight: 500 }}>Tempo</th>
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map(s => <SetRow key={s.id} set={s} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const typeBadgeColor: Record<string, string> = {
    strength: '#C9A84C',
    run: '#4C9AC9',
    recovery: '#4CC98A',
  }
  const badgeColor = typeBadgeColor[workout.type] ?? '#9A9488'
  const sectionGroups = groupBySection(workout.exercises)

  return (
    <div style={{
      background: '#1A1A1A',
      border: '1px solid rgba(201,168,76,0.2)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>{formatWorkoutDate(workout.date)}</div>
        <span style={{
          background: badgeColor,
          color: '#111',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '3px 8px',
          borderRadius: 4,
        }}>
          {workout.type}
        </span>
      </div>

      {workout.type === 'strength' && sectionGroups.size > 0 && (
        <div>
          {Array.from(sectionGroups.entries()).map(([section, exercises]) => (
            <div key={section} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#C9A84C',
                marginBottom: 12,
                paddingBottom: 4,
                borderBottom: '1px solid rgba(201,168,76,0.15)',
              }}>
                {section}
              </div>
              {exercises.map(ex => <ExerciseBlock key={ex.id} exercise={ex} />)}
            </div>
          ))}
        </div>
      )}

      {workout.type === 'run' && workout.runWorkout && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {workout.runWorkout.targetMiles != null && (
            <div><span style={{ color: 'var(--ink-muted, #9A9488)', fontSize: 13 }}>Target Miles</span> <strong>{workout.runWorkout.targetMiles}</strong></div>
          )}
          {workout.runWorkout.targetPace && (
            <div><span style={{ color: 'var(--ink-muted, #9A9488)', fontSize: 13 }}>Target Pace</span> <strong>{workout.runWorkout.targetPace}</strong></div>
          )}
          {workout.runWorkout.heartRateZone && (
            <div><span style={{ color: 'var(--ink-muted, #9A9488)', fontSize: 13 }}>HR Zone</span> <strong>{workout.runWorkout.heartRateZone}</strong></div>
          )}
        </div>
      )}

      {workout.type === 'recovery' && (
        <div style={{ color: 'var(--ink-muted, #9A9488)', fontSize: 14 }}>
          {workout.notes ?? 'Recovery day'}
        </div>
      )}
    </div>
  )
}

export default function WorkoutPage() {
  const [weekOf, setWeekOf] = useState(currentMonday())
  const [queryWeek, setQueryWeek] = useState(currentMonday())

  const { data, loading, error } = useQuery<{ trainingWeek: TrainingWeek | null }>(GET_TRAINING_WEEK, {
    variables: { weekOf: queryWeek },
    fetchPolicy: 'cache-and-network',
  })

  const week = data?.trainingWeek

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      color: '#F5F0E8',
      fontFamily: 'DM Sans, sans-serif',
      padding: '24px 16px 80px',
      maxWidth: 680,
      margin: '0 auto',
    }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 20, color: '#C9A84C' }}>
        Training
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        <input
          type="text"
          value={weekOf}
          onChange={e => setWeekOf(e.target.value)}
          placeholder="YYYY-MM-DD"
          style={{
            flex: 1,
            background: '#1A1A1A',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#F5F0E8',
            fontSize: 15,
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
          }}
        />
        <button
          onClick={() => setQueryWeek(weekOf)}
          style={{
            background: '#C9A84C',
            color: '#111',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            minWidth: 90,
          }}
        >
          Load Week
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--ink-muted, #9A9488)', padding: 40 }}>Loading…</div>
      )}

      {error && (
        <div style={{
          background: 'rgba(200,50,50,0.1)',
          border: '1px solid rgba(200,50,50,0.3)',
          borderRadius: 8,
          padding: 16,
          color: '#f88',
          fontSize: 14,
        }}>
          {error.message}
        </div>
      )}

      {!loading && !error && week === null && (
        <div style={{ textAlign: 'center', color: 'var(--ink-muted, #9A9488)', padding: 40 }}>
          No training week found for {queryWeek}.<br />
          <span style={{ fontSize: 13 }}>Upload a PDF via the GraphQL API to get started.</span>
        </div>
      )}

      {week && week.workouts.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--ink-muted, #9A9488)', padding: 40 }}>
          Training week exists but has no workouts.
        </div>
      )}

      {week && week.workouts.map(w => <WorkoutCard key={w.id} workout={w} />)}
    </div>
  )
}
