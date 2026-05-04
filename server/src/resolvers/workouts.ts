import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { GraphQLError } from 'graphql'
import { parsePdfWorkouts, getWorkoutDate, generateRunPrescriptions } from '../services/workoutParsing'
import type { PastRunSummary } from '../services/workoutParsing'
import { fetchExerciseHistory } from '../services/exerciseHistory'
import type { HistorySession } from '../services/exerciseHistory'
import { generateCoachNotes } from '../services/coachReview'
import { createAllDayCalendarEvent } from '../services/calendarWriter'

const prisma = new PrismaClient()

type Context = { person: { id: string; name: string; color: string } | null }

function requirePerson(ctx: Context) {
  if (!ctx.person) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } })
  return ctx.person
}

async function getOrCreateAthlete(personId: string) {
  return prisma.athlete.upsert({
    where: { personId },
    create: { personId },
    update: {},
  })
}

const workoutInclude = {
  exercises: {
    orderBy: { order: 'asc' as const },
    include: { sets: { orderBy: { setNumber: 'asc' as const } } },
  },
  runWorkout: {
    include: {
      segments: { orderBy: { order: 'asc' as const } },
    },
  },
}

type WorkoutWithIncludes = Prisma.WorkoutGetPayload<{ include: typeof workoutInclude }>

function formatWeek<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }
}

function formatWorkout(w: WorkoutWithIncludes) {
  return {
    ...w,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
    completedAt: w.completedAt ? w.completedAt.toISOString() : null,
    exercises: w.exercises.map(e => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      sets: e.sets.map(s => ({
        ...s,
        completedAt: s.completedAt ? s.completedAt.toISOString() : null,
      })),
    })),
    runWorkout: w.runWorkout
      ? {
          ...w.runWorkout,
          completedAt: w.runWorkout.completedAt ? w.runWorkout.completedAt.toISOString() : null,
          segments: w.runWorkout.segments,
        }
      : null,
  }
}

const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

async function fetchPastRunSummaries(athleteId: string, weekOf: string): Promise<PastRunSummary[]> {
  const rows = await prisma.workout.findMany({
    where: {
      type: 'run',
      date: { lt: weekOf },
      runWorkout: { completed: true },
      trainingWeek: { athleteId },
    },
    include: {
      runWorkout: {
        include: { segments: { orderBy: { order: 'asc' } } },
      },
    },
    orderBy: { date: 'desc' },
    take: 8,
  })
  return rows
    .filter(r => r.runWorkout)
    .map(r => ({
      date: r.date,
      dayName: DAY_NAMES_SHORT[r.dayOfWeek] ?? '?',
      workoutType: r.runWorkout!.workoutType,
      prescribed: {
        targetMiles: r.runWorkout!.targetMiles,
        targetPace: r.runWorkout!.targetPace,
        heartRateZone: r.runWorkout!.heartRateZone,
        segments: r.runWorkout!.segments.map(s => ({
          order: s.order,
          label: s.label,
          type: s.type,
          repeat: s.repeat,
          distanceMi: s.distanceMi,
          durationSec: s.durationSec,
          pace: s.pace,
          heartRateZone: s.heartRateZone,
          notes: s.notes,
        })),
      },
      actual: {
        actualMiles: r.runWorkout!.actualMiles,
        actualTime: r.runWorkout!.actualTime,
        avgHeartRate: r.runWorkout!.avgHeartRate,
        maxHeartRate: r.runWorkout!.maxHeartRate,
        actualRPE: r.runWorkout!.actualRPE,
        notes: r.runWorkout!.notes,
      },
    }))
}

export const workoutResolvers = {
  Query: {
    trainingWeek: async (_: unknown, { weekOf }: { weekOf: string }, ctx: Context) => {
      const person = requirePerson(ctx)
      const athlete = await prisma.athlete.findUnique({ where: { personId: person.id } })
      if (!athlete) return null

      const week = await prisma.trainingWeek.findUnique({
        where: { athleteId_weekOf: { athleteId: athlete.id, weekOf } },
        include: {
          workouts: {
            orderBy: { dayOfWeek: 'asc' },
            include: workoutInclude,
          },
        },
      })
      if (!week) return null

      return {
        ...formatWeek(week),
        workouts: week.workouts.map(formatWorkout),
      }
    },

    workout: async (_: unknown, { id }: { id: string }) => {
      const w = await prisma.workout.findUnique({ where: { id }, include: workoutInclude })
      if (!w) return null
      return formatWorkout(w)
    },

    weekWorkouts: async (_: unknown, { weekOf }: { weekOf: string }, ctx: Context) => {
      const person = requirePerson(ctx)
      const athlete = await prisma.athlete.findUnique({ where: { personId: person.id } })
      if (!athlete) return []

      const week = await prisma.trainingWeek.findUnique({
        where: { athleteId_weekOf: { athleteId: athlete.id, weekOf } },
        include: {
          workouts: {
            orderBy: { dayOfWeek: 'asc' },
            include: workoutInclude,
          },
        },
      })
      if (!week) return []
      return week.workouts.map(formatWorkout)
    },

    workoutExerciseHistory: async (
      _: unknown,
      { workoutId, limit }: { workoutId: string; limit?: number | null },
      ctx: Context,
    ) => {
      const person = requirePerson(ctx)
      const workout = await prisma.workout.findUnique({
        where: { id: workoutId },
        include: {
          exercises: { orderBy: { order: 'asc' } },
          trainingWeek: true,
        },
      })
      if (!workout) return []

      const athlete = await prisma.athlete.findUnique({ where: { personId: person.id } })
      if (!athlete || workout.trainingWeek.athleteId !== athlete.id) {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } })
      }

      const cap = limit ?? 6
      return Promise.all(workout.exercises.map(async ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        sessions: await fetchExerciseHistory(athlete.id, ex.name, workout.date, workout.date, cap),
      })))
    },
  },

  Mutation: {
    uploadTrainingPDF: async (_: unknown, { pdfPath, weekOf }: { pdfPath: string; weekOf: string }, ctx: Context) => {
      const person = requirePerson(ctx)
      const athlete = await getOrCreateAthlete(person.id)

      await prisma.trainingWeek.deleteMany({
        where: { athleteId: athlete.id, weekOf },
      })

      const pastRuns = await fetchPastRunSummaries(athlete.id, weekOf)
      const [parsedStrengthWorkouts, prescriptions] = await Promise.all([
        parsePdfWorkouts(pdfPath),
        generateRunPrescriptions({ pastRuns, weekOf }).catch(err => {
          console.error('[workouts] generateRunPrescriptions failed:', err)
          return null
        }),
      ])

      // Build flat exercise list and per-name history for the coach review pass
      const flatExercises = parsedStrengthWorkouts.flatMap(pw => pw.exercises)
      const uniqueNames = Array.from(new Set(flatExercises.map(e => e.name)))
      const historyByName = new Map<string, HistorySession[]>()
      await Promise.all(uniqueNames.map(async name => {
        const sessions = await fetchExerciseHistory(athlete.id, name, weekOf, weekOf, 6)
        historyByName.set(name, sessions)
      }))

      const coachNotesByName = await generateCoachNotes(
        flatExercises.map(ex => ({
          name: ex.name,
          section: ex.section,
          sets: ex.sets.map(s => ({
            targetReps: s.targetReps,
            targetWeight: s.targetWeight,
            targetRPE: s.targetRPE,
            tempo: s.tempo,
          })),
          history: historyByName.get(ex.name) ?? [],
        })),
      ).catch(err => {
        console.error('[workouts] generateCoachNotes failed:', err)
        return new Map<string, string>()
      })

      const workoutsToCreate: Prisma.WorkoutCreateWithoutTrainingWeekInput[] = []

      for (const pw of parsedStrengthWorkouts) {
        const { dayOfWeek, date } = getWorkoutDate(weekOf, pw.dayName)
        workoutsToCreate.push({
          date,
          dayOfWeek,
          type: 'strength',
          exercises: {
            create: pw.exercises.map((ex, exIdx) => ({
              name: ex.name,
              section: ex.section,
              order: exIdx,
              loadingNote: ex.loadingNote ?? null,
              coachNotes: coachNotesByName.get(ex.name) || null,
              sets: {
                create: ex.sets.map(s => ({
                  setNumber: s.setNumber,
                  targetReps: s.targetReps ?? null,
                  targetWeight: s.targetWeight ?? null,
                  targetRPE: s.targetRPE ?? null,
                  tempo: s.tempo ?? null,
                })),
              },
            })),
          },
        })
      }

      // Tuesday run
      {
        const { dayOfWeek, date } = getWorkoutDate(weekOf, 'Tuesday')
        const tue = prescriptions?.tuesday
        workoutsToCreate.push({
          date,
          dayOfWeek,
          type: 'run',
          notes: tue?.summary ?? null,
          runWorkout: {
            create: {
              workoutType: tue?.workoutType ?? null,
              targetMiles: tue?.targetMiles ?? null,
              targetPace: tue?.targetPace ?? null,
              heartRateZone: tue?.heartRateZone ?? null,
              notes: tue?.notes ?? null,
            },
          },
        })
      }

      // Thursday yoga
      {
        const { dayOfWeek, date } = getWorkoutDate(weekOf, 'Thursday')
        workoutsToCreate.push({
          date,
          dayOfWeek,
          type: 'yoga',
          notes: prescriptions?.thursdayYogaNote || null,
        })
      }

      // Saturday run (may have segments)
      {
        const { dayOfWeek, date } = getWorkoutDate(weekOf, 'Saturday')
        const sat = prescriptions?.saturday
        workoutsToCreate.push({
          date,
          dayOfWeek,
          type: 'run',
          notes: sat?.summary ?? null,
          runWorkout: {
            create: {
              workoutType: sat?.workoutType ?? null,
              targetMiles: sat?.targetMiles ?? null,
              targetPace: sat?.targetPace ?? null,
              heartRateZone: sat?.heartRateZone ?? null,
              notes: sat?.notes ?? null,
              segments: sat?.segments?.length
                ? {
                    create: sat.segments.map(s => ({
                      order: s.order,
                      label: s.label,
                      type: s.type,
                      repeat: s.repeat,
                      distanceMi: s.distanceMi,
                      durationSec: s.durationSec,
                      pace: s.pace,
                      heartRateZone: s.heartRateZone,
                      notes: s.notes,
                    })),
                  }
                : undefined,
            },
          },
        })
      }

      // Sunday rest
      {
        const { dayOfWeek, date } = getWorkoutDate(weekOf, 'Sunday')
        workoutsToCreate.push({ date, dayOfWeek, type: 'rest' })
      }

      const week = await prisma.trainingWeek.create({
        data: {
          athleteId: athlete.id,
          weekOf,
          workouts: { create: workoutsToCreate },
        },
        include: {
          workouts: { orderBy: { dayOfWeek: 'asc' }, include: workoutInclude },
        },
      })

      const personSlug = person.name.toLowerCase()
      for (const w of week.workouts) {
        if (w.type === 'rest') continue

        if (w.type === 'strength') {
          const exerciseNames = w.exercises.map(e => e.name)
          const desc = [...exerciseNames, `https://diverseydash.com/workout/strength/${w.id}`].join('\n')
          createAllDayCalendarEvent(personSlug, 'Strength Training', w.date, desc).catch(err =>
            console.error('[workouts] strength calendar event failed:', err)
          )
        } else if (w.type === 'run') {
          const r = w.runWorkout
          let title = 'Run'
          if (r) {
            const typeLabel = r.workoutType
              ? r.workoutType.charAt(0).toUpperCase() + r.workoutType.slice(1)
              : 'Run'
            const milesPart = r.targetMiles ? ` – ${r.targetMiles} mi` : ''
            title = `${typeLabel}${milesPart}`
          }
          createAllDayCalendarEvent(personSlug, title, w.date, `https://diverseydash.com/workout/run/${w.id}`).catch(err =>
            console.error('[workouts] run calendar event failed:', err)
          )
        } else if (w.type === 'yoga') {
          createAllDayCalendarEvent(personSlug, 'Yoga', w.date, `https://diverseydash.com/workout/yoga/${w.id}`).catch(err =>
            console.error('[workouts] yoga calendar event failed:', err)
          )
        }
      }

      return {
        ...formatWeek(week),
        workouts: week.workouts.map(formatWorkout),
      }
    },

    logSet: async (
      _: unknown,
      { setId, actualReps, actualWeight, actualRPE, notes }: {
        setId: string; actualReps?: string; actualWeight?: number; actualRPE?: string; notes?: string
      },
      ctx: Context
    ) => {
      requirePerson(ctx)
      const set = await prisma.strengthSet.update({
        where: { id: setId },
        data: {
          ...(actualReps !== undefined && { actualReps }),
          ...(actualWeight !== undefined && { actualWeight }),
          ...(actualRPE !== undefined && { actualRPE }),
          ...(notes !== undefined && { notes }),
        },
      })
      return { ...set, completedAt: set.completedAt ? set.completedAt.toISOString() : null }
    },

    completeSet: async (_: unknown, { setId }: { setId: string }, ctx: Context) => {
      requirePerson(ctx)
      const set = await prisma.strengthSet.update({
        where: { id: setId },
        data: { completed: true, completedAt: new Date() },
      })
      return { ...set, completedAt: set.completedAt ? set.completedAt.toISOString() : null }
    },

    uncompleteSet: async (_: unknown, { setId }: { setId: string }, ctx: Context) => {
      requirePerson(ctx)
      const set = await prisma.strengthSet.update({
        where: { id: setId },
        data: { completed: false, completedAt: null },
      })
      return { ...set, completedAt: null }
    },

    createRunWorkout: async (
      _: unknown,
      { weekOf, date, targetMiles, targetPace }: { weekOf: string; date: string; targetMiles?: number; targetPace?: string },
      ctx: Context
    ) => {
      const person = requirePerson(ctx)
      const athlete = await getOrCreateAthlete(person.id)

      const week = await prisma.trainingWeek.upsert({
        where: { athleteId_weekOf: { athleteId: athlete.id, weekOf } },
        create: { athleteId: athlete.id, weekOf },
        update: {},
      })

      const { dayOfWeek } = getWorkoutDate(weekOf, new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }))

      const workout = await prisma.workout.create({
        data: {
          trainingWeekId: week.id,
          date,
          dayOfWeek,
          type: 'run',
          runWorkout: { create: { targetMiles: targetMiles ?? null, targetPace: targetPace ?? null } },
        },
        include: workoutInclude,
      })

      const personSlug = person.name.toLowerCase()
      const runTitle = targetMiles && targetPace
        ? `Run – ${targetMiles} mi @ ${targetPace}/mi`
        : targetMiles
          ? `Run – ${targetMiles} mi`
          : 'Run Workout'
      const runDescription = `https://diverseydash.com/workout/run/${workout.id}`
      createAllDayCalendarEvent(personSlug, runTitle, date, runDescription).catch(err =>
        console.error('[workouts] Failed to create run calendar event:', err)
      )

      return formatWorkout(workout)
    },

    logRunWorkout: async (
      _: unknown,
      { workoutId, actualMiles, actualTime, avgHeartRate, maxHeartRate, actualRPE, notes }: {
        workoutId: string; actualMiles: number; actualTime: number
        avgHeartRate?: number; maxHeartRate?: number; actualRPE?: number; notes?: string
      },
      ctx: Context
    ) => {
      requirePerson(ctx)
      const run = await prisma.runWorkout.update({
        where: { workoutId },
        data: {
          actualMiles,
          actualTime,
          avgHeartRate: avgHeartRate ?? null,
          maxHeartRate: maxHeartRate ?? null,
          actualRPE: actualRPE ?? null,
          notes: notes ?? null,
          completed: true,
          completedAt: new Date(),
        },
      })
      return { ...run, completedAt: run.completedAt ? run.completedAt.toISOString() : null }
    },

    completeWorkout: async (_: unknown, { workoutId }: { workoutId: string }, ctx: Context) => {
      requirePerson(ctx)
      const workout = await prisma.workout.update({
        where: { id: workoutId },
        data: { completedAt: new Date() },
        include: workoutInclude,
      })
      return formatWorkout(workout)
    },

    uncompleteWorkout: async (_: unknown, { workoutId }: { workoutId: string }, ctx: Context) => {
      requirePerson(ctx)
      await prisma.runWorkout.updateMany({
        where: { workoutId },
        data: { completed: false, completedAt: null },
      })
      const workout = await prisma.workout.update({
        where: { id: workoutId },
        data: { completedAt: null },
        include: workoutInclude,
      })
      return formatWorkout(workout)
    },

    createRestWorkout: async (
      _: unknown,
      { weekOf, date, notes }: { weekOf: string; date: string; notes?: string },
      ctx: Context
    ) => {
      const person = requirePerson(ctx)
      const athlete = await getOrCreateAthlete(person.id)

      const week = await prisma.trainingWeek.upsert({
        where: { athleteId_weekOf: { athleteId: athlete.id, weekOf } },
        create: { athleteId: athlete.id, weekOf },
        update: {},
      })

      const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })
      const { dayOfWeek } = getWorkoutDate(weekOf, dayName)

      const workout = await prisma.workout.create({
        data: {
          trainingWeekId: week.id,
          date,
          dayOfWeek,
          type: 'rest',
          notes: notes ?? null,
        },
        include: workoutInclude,
      })
      return formatWorkout(workout)
    },

    createYogaWorkout: async (
      _: unknown,
      { weekOf, date, notes }: { weekOf: string; date: string; notes?: string },
      ctx: Context
    ) => {
      const person = requirePerson(ctx)
      const athlete = await getOrCreateAthlete(person.id)

      const week = await prisma.trainingWeek.upsert({
        where: { athleteId_weekOf: { athleteId: athlete.id, weekOf } },
        create: { athleteId: athlete.id, weekOf },
        update: {},
      })

      const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })
      const { dayOfWeek } = getWorkoutDate(weekOf, dayName)

      const workout = await prisma.workout.create({
        data: {
          trainingWeekId: week.id,
          date,
          dayOfWeek,
          type: 'yoga',
          notes: notes ?? null,
        },
        include: workoutInclude,
      })
      return formatWorkout(workout)
    },

    updateWorkoutNotes: async (
      _: unknown,
      { workoutId, notes }: { workoutId: string; notes: string },
      ctx: Context
    ) => {
      requirePerson(ctx)
      const workout = await prisma.workout.update({
        where: { id: workoutId },
        data: { notes },
        include: workoutInclude,
      })
      return formatWorkout(workout)
    },

    updateExercise: async (
      _: unknown,
      { id, name }: { id: string; name: string },
      ctx: Context
    ) => {
      requirePerson(ctx)
      const ex = await prisma.strengthExercise.update({
        where: { id },
        data: { name },
        include: { sets: { orderBy: { setNumber: 'asc' } } },
      })
      return {
        ...ex,
        createdAt: ex.createdAt.toISOString(),
        sets: ex.sets.map((s: typeof ex.sets[number]) => ({ ...s, completedAt: s.completedAt ? s.completedAt.toISOString() : null })),
      }
    },

    updateSet: async (
      _: unknown,
      { id, targetReps, targetWeight, targetRPE, tempo }: {
        id: string; targetReps?: string; targetWeight?: number; targetRPE?: string; tempo?: string
      },
      ctx: Context
    ) => {
      requirePerson(ctx)
      const set = await prisma.strengthSet.update({
        where: { id },
        data: {
          ...(targetReps !== undefined && { targetReps }),
          ...(targetWeight !== undefined && { targetWeight }),
          ...(targetRPE !== undefined && { targetRPE }),
          ...(tempo !== undefined && { tempo }),
        },
      })
      return { ...set, completedAt: set.completedAt ? set.completedAt.toISOString() : null }
    },

    addSet: async (_: unknown, { exerciseId }: { exerciseId: string }, ctx: Context) => {
      requirePerson(ctx)
      const lastSet = await prisma.strengthSet.findFirst({
        where: { exerciseId },
        orderBy: { setNumber: 'desc' },
      })
      const setNumber = (lastSet?.setNumber ?? 0) + 1
      const set = await prisma.strengthSet.create({
        data: { exerciseId, setNumber },
      })
      return { ...set, completedAt: set.completedAt ? set.completedAt.toISOString() : null }
    },

    deleteSet: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requirePerson(ctx)
      await prisma.strengthSet.delete({ where: { id } })
      return true
    },
  },
}
