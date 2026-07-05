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
  // Fetch a larger window than requested since sessions with no logged sets
  // get dropped below — over-fetch so we can still fill up to `limit` real sessions.
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
    take: Math.max(limit * 4, 20),
  })

  const sessions: HistorySession[] = []
  for (const ex of rows) {
    const loggedSets = ex.sets
      .filter(s => s.actualReps != null)
      .map(s => ({
        setNumber: s.setNumber,
        reps: s.actualReps,
        weight: s.actualWeight ?? null,
        rpe: s.actualRPE ?? null,
      }))
    if (loggedSets.length === 0) continue // movement was skipped entirely this session

    sessions.push({
      workoutId: ex.workoutId,
      date: ex.workout.date,
      relative: formatRelative(diffWeeks(anchorDate, ex.workout.date)),
      sets: loggedSets,
    })
    if (sessions.length >= limit) break
  }
  return sessions
}
