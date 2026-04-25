import { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import { parsePdfWorkouts, getWorkoutDate } from '../services/workoutParsing'

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
  runWorkout: true,
}

function formatWeek<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }
}

function formatWorkout(w: {
  id: string; date: string; dayOfWeek: number; type: string; notes: string | null
  completedAt: Date | null; createdAt: Date; updatedAt: Date
  exercises: Array<{
    id: string; name: string; section: string; order: number; createdAt: Date
    sets: Array<{
      id: string; setNumber: number; targetReps: string | null; targetWeight: number | null
      targetRPE: string | null; tempo: string | null; actualReps: string | null
      actualWeight: number | null; actualRPE: string | null; notes: string | null
      completed: boolean; completedAt: Date | null
    }>
  }>
  runWorkout: {
    id: string; targetMiles: number | null; targetPace: string | null; heartRateZone: string | null
    actualMiles: number | null; actualTime: number | null; avgHeartRate: number | null
    maxHeartRate: number | null; notes: string | null; completed: boolean; completedAt: Date | null
  } | null
}) {
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
      ? { ...w.runWorkout, completedAt: w.runWorkout.completedAt ? w.runWorkout.completedAt.toISOString() : null }
      : null,
  }
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
  },

  Mutation: {
    uploadTrainingPDF: async (_: unknown, { pdfPath, weekOf }: { pdfPath: string; weekOf: string }, ctx: Context) => {
      const person = requirePerson(ctx)
      const athlete = await getOrCreateAthlete(person.id)

      // Delete existing week so re-upload is idempotent
      await prisma.trainingWeek.deleteMany({
        where: { athleteId: athlete.id, weekOf },
      })

      const parsedWorkouts = await parsePdfWorkouts(pdfPath)

      const week = await prisma.trainingWeek.create({
        data: {
          athleteId: athlete.id,
          weekOf,
          workouts: {
            create: parsedWorkouts.map(pw => {
              const { dayOfWeek, date } = getWorkoutDate(weekOf, pw.dayName)
              return {
                date,
                dayOfWeek,
                type: 'strength',
                exercises: {
                  create: pw.exercises.map((ex, exIdx) => ({
                    name: ex.name,
                    section: ex.section,
                    order: exIdx,
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
              }
            }),
          },
        },
        include: {
          workouts: {
            orderBy: { dayOfWeek: 'asc' },
            include: workoutInclude,
          },
        },
      })

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

    createRunWorkout: async (
      _: unknown,
      { weekOf, date, targetMiles, targetPace }: { weekOf: string; date: string; targetMiles?: number; targetPace?: string },
      ctx: Context
    ) => {
      const person = requirePerson(ctx)
      const athlete = await getOrCreateAthlete(person.id)

      const week = await prisma.trainingWeek.findUniqueOrThrow({
        where: { athleteId_weekOf: { athleteId: athlete.id, weekOf } },
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
      return formatWorkout(workout)
    },

    logRunWorkout: async (
      _: unknown,
      { workoutId, actualMiles, actualTime, avgHeartRate, maxHeartRate, notes }: {
        workoutId: string; actualMiles: number; actualTime: number
        avgHeartRate?: number; maxHeartRate?: number; notes?: string
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

    createRecoveryWorkout: async (
      _: unknown,
      { weekOf, date, notes }: { weekOf: string; date: string; notes?: string },
      ctx: Context
    ) => {
      const person = requirePerson(ctx)
      const athlete = await getOrCreateAthlete(person.id)

      const week = await prisma.trainingWeek.findUniqueOrThrow({
        where: { athleteId_weekOf: { athleteId: athlete.id, weekOf } },
      })

      const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })
      const { dayOfWeek } = getWorkoutDate(weekOf, dayName)

      const workout = await prisma.workout.create({
        data: {
          trainingWeekId: week.id,
          date,
          dayOfWeek,
          type: 'recovery',
          notes: notes ?? null,
        },
        include: workoutInclude,
      })
      return formatWorkout(workout)
    },
  },
}
