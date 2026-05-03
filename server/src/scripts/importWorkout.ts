import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { parsePdfWorkouts, getWorkoutDate, generateRunPrescriptions } from '../services/workoutParsing'
import type { PastRunSummary } from '../services/workoutParsing'
import { fetchExerciseHistory } from '../services/exerciseHistory'
import type { HistorySession } from '../services/exerciseHistory'
import { generateCoachNotes } from '../services/coachReview'
import { createAllDayCalendarEvent } from '../services/calendarWriter'

const prisma = new PrismaClient()

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

async function main() {
  const [pdfPath, weekOf] = process.argv.slice(2)

  if (!pdfPath || !weekOf) {
    console.error('Usage: npm run importWorkout -- <pdfPath> <weekOf>')
    console.error('  Example: npm run importWorkout -- /home/jon/pdfs/persist-040626.pdf 2026-04-28')
    process.exit(1)
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekOf)) {
    console.error('weekOf must be a Monday date in YYYY-MM-DD format')
    process.exit(1)
  }

  const person = await prisma.person.findFirst({ where: { name: 'Jon' } })
  if (!person) {
    console.error('Person "Jon" not found in database. Run the seed first.')
    process.exit(1)
  }

  console.log(`\nParsing PDF: ${pdfPath}`)
  console.log(`Week of: ${weekOf}`)
  console.log(`Person: ${person.name} (${person.id})\n`)

  const athlete = await prisma.athlete.upsert({
    where: { personId: person.id },
    create: { personId: person.id },
    update: {},
  })

  await prisma.trainingWeek.deleteMany({
    where: { athleteId: athlete.id, weekOf },
  })
  console.log('Cleared existing week (idempotent re-import)\n')

  console.log('Sending to Claude (PDF parse + run prescription in parallel)…')
  const pastRuns = await fetchPastRunSummaries(athlete.id, weekOf)
  console.log(`  Found ${pastRuns.length} past completed run(s) for context`)

  const [parsedStrengthWorkouts, prescriptions] = await Promise.all([
    parsePdfWorkouts(pdfPath),
    generateRunPrescriptions({ pastRuns, weekOf }).catch(err => {
      console.error('  ✗ generateRunPrescriptions failed:', err)
      return null
    }),
  ])

  console.log(`  PDF: ${parsedStrengthWorkouts.length} strength workout(s)`)
  console.log(`  Runs: ${prescriptions ? 'prescribed (Tue + Sat)' : 'FAILED — empty stubs will be created'}`)

  // Coach review pass — fetch history per exercise, then ask Claude for notes
  const flatExercises = parsedStrengthWorkouts.flatMap(pw => pw.exercises)
  const uniqueNames = Array.from(new Set(flatExercises.map(e => e.name)))
  console.log(`  Fetching history for ${uniqueNames.length} unique exercise(s)…`)
  const historyByName = new Map<string, HistorySession[]>()
  await Promise.all(uniqueNames.map(async name => {
    const sessions = await fetchExerciseHistory(athlete.id, name, weekOf, weekOf, 6)
    historyByName.set(name, sessions)
  }))

  console.log(`  Sending coach review to Claude…`)
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
    console.error('  ✗ generateCoachNotes failed:', err)
    return new Map<string, string>()
  })
  const nonEmptyNotes = Array.from(coachNotesByName.values()).filter(n => n.trim().length > 0).length
  console.log(`  Coach: ${nonEmptyNotes}/${flatExercises.length} notes generated\n`)

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
      workouts: {
        orderBy: { dayOfWeek: 'asc' },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { sets: { orderBy: { setNumber: 'asc' } } },
          },
          runWorkout: {
            include: { segments: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
  })

  // Fire-and-forget calendar events: strength + run + yoga (NOT rest)
  const personSlug = person.name.toLowerCase()
  for (const w of week.workouts) {
    if (w.type === 'rest') continue
    try {
      if (w.type === 'strength') {
        const exerciseNames = w.exercises.map((e: { name: string }) => e.name)
        const desc = [...exerciseNames, `https://diverseydash.com/workout/strength/${w.id}`].join('\n')
        const eventId = await createAllDayCalendarEvent(personSlug, 'Strength Training', w.date, desc)
        console.log(`  📅 Strength calendar event created for ${w.date}: ${eventId ?? 'no ID'}`)
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
        const eventId = await createAllDayCalendarEvent(personSlug, title, w.date, `https://diverseydash.com/workout/run/${w.id}`)
        console.log(`  📅 Run calendar event created for ${w.date}: ${eventId ?? 'no ID'}`)
      } else if (w.type === 'yoga') {
        const eventId = await createAllDayCalendarEvent(personSlug, 'Yoga', w.date, `https://diverseydash.com/workout/yoga/${w.id}`)
        console.log(`  📅 Yoga calendar event created for ${w.date}: ${eventId ?? 'no ID'}`)
      }
    } catch (err) {
      console.error(`  ✗ Calendar event failed for ${w.date}:`, err)
    }
  }

  // Print summary
  console.log(`\n✓ Training week created (id: ${week.id})\n`)
  for (const w of week.workouts) {
    const dayName = DAY_NAMES_SHORT[w.dayOfWeek] ?? '?'
    if (w.type === 'strength') {
      console.log(`  ${w.date} (${dayName}) — STRENGTH — ${w.exercises.length} exercise(s)`)
      for (const ex of w.exercises) {
        const sample = ex.sets[0]
        const sampleStr = sample
          ? `${sample.targetReps ?? '?'} reps @ RPE ${sample.targetRPE ?? '?'}${sample.tempo ? ` ${sample.tempo}` : ''}`
          : ''
        console.log(`    • [${ex.section}] ${ex.name} — ${ex.sets.length} set(s)${sampleStr ? ` (e.g. ${sampleStr})` : ''}`)
      }
    } else if (w.type === 'run') {
      const r = w.runWorkout
      const summary = w.notes ?? r?.workoutType ?? 'Run'
      const details = r
        ? [r.targetMiles ? `${r.targetMiles} mi` : null, r.targetPace ? `@ ${r.targetPace}/mi` : null, r.heartRateZone].filter(Boolean).join(', ')
        : ''
      console.log(`  ${w.date} (${dayName}) — RUN — ${summary}${details ? ` · ${details}` : ''}`)
      if (r?.segments?.length) {
        for (const s of r.segments) {
          console.log(`    ${s.order}. ${s.label}${s.repeat ? ` ×${s.repeat}` : ''}${s.distanceMi ? ` ${s.distanceMi} mi` : ''}${s.pace ? ` @ ${s.pace}` : ''}`)
        }
      }
    } else if (w.type === 'yoga') {
      console.log(`  ${w.date} (${dayName}) — YOGA${w.notes ? ` · ${w.notes}` : ''}`)
    } else if (w.type === 'rest') {
      console.log(`  ${w.date} (${dayName}) — REST`)
    }
    console.log()
  }

  await prisma.$disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
