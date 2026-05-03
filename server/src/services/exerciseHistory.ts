import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface HistorySet {
  setNumber: number
  reps: string | null
  weight: number | null
  rpe: string | null
}

export interface HistorySession {
  workoutId: string
  date: string
  relative: string
  sets: HistorySet[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function diffWeeks(anchor: string, target: string): number {
  const [ay, am, ad] = anchor.split('-').map(Number)
  const [ty, tm, td] = target.split('-').map(Number)
  const a = Date.UTC(ay, am - 1, ad)
  const t = Date.UTC(ty, tm - 1, td)
  return Math.floor((a - t) / (7 * MS_PER_DAY))
}

function formatRelative(weeks: number): string {
  if (weeks <= 0) return 'this week'
  if (weeks === 1) return '1w ago'
  return `${weeks}w ago`
}

export async function fetchExerciseHistory(
  athleteId: string,
  exerciseName: string,
  beforeDate: string,
  anchorDate: string,
  limit: number = 6,
): Promise<HistorySession[]> {
  const rows = await prisma.strengthExercise.findMany({
    where: {
      name: { equals: exerciseName },
      workout: {
        date: { lt: beforeDate },
        trainingWeek: { athleteId },
      },
    },
    include: {
      sets: { orderBy: { setNumber: 'asc' } },
      workout: true,
    },
    orderBy: { workout: { date: 'desc' } },
    take: limit,
  })

  return rows.map(ex => {
    const exerciseCompleted = ex.workout.completedAt != null
    return {
      workoutId: ex.workoutId,
      date: ex.workout.date,
      relative: formatRelative(diffWeeks(anchorDate, ex.workout.date)),
      sets: ex.sets.map(s => {
        const hasAnyActual = s.actualReps != null || s.actualWeight != null || s.actualRPE != null
        if (hasAnyActual || exerciseCompleted) {
          return {
            setNumber: s.setNumber,
            reps: s.actualReps ?? null,
            weight: s.actualWeight ?? null,
            rpe: s.actualRPE ?? null,
          }
        }
        return {
          setNumber: s.setNumber,
          reps: s.targetReps ?? null,
          weight: s.targetWeight ?? null,
          rpe: s.targetRPE ?? null,
        }
      }),
    }
  })
}
