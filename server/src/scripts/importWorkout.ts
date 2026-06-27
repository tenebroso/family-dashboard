import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { parsePdfWorkouts, getWorkoutDate } from '../services/workoutParsing'
import { fetchExerciseHistory } from '../services/exerciseHistory'
import type { HistorySession } from '../services/exerciseHistory'
import { generateCoachNotes } from '../services/coachReview'
import { createAllDayCalendarEvent } from '../services/calendarWriter'

const prisma = new PrismaClient()

const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ACTIVE_RECOVERY_CUE = `\n\nEFFORT CHECK: This should be fully conversational the entire time — full sentences without breaking. If you can't hold a sentence, you're going too hard. Slow down.`
const INTERVALS_CUE = `\n\nEFFORT CHECK: 75% effort = moderate-hard. You can gasp 2-3 words but not a full sentence. Controlled — not all-out. If you're unable to say anything, back off.`

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

  console.log('Sending PDF to Claude for parsing…')
  const parsedWorkouts = await parsePdfWorkouts(pdfPath)
  const strengthCount = parsedWorkouts.filter(pw => pw.type === 'strength').length
  const intervalsCount = parsedWorkouts.filter(pw => pw.type === 'intervals').length
  const recoveryCount = parsedWorkouts.filter(pw => pw.type === 'active_recovery').length
  console.log(`  PDF: ${parsedWorkouts.length} day(s) — ${strengthCount} strength, ${intervalsCount} intervals, ${recoveryCount} active recovery`)

  // Coach review pass — fetch history per exercise, then ask Claude for notes
  const strengthWorkouts = parsedWorkouts.filter(pw => pw.type === 'strength')
  const flatExercises = strengthWorkouts.flatMap(pw => pw.exercises)
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

  for (const pw of parsedWorkouts) {
    const { dayOfWeek, date } = getWorkoutDate(weekOf, pw.dayName)

    if (pw.type === 'strength') {
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
    } else if (pw.type === 'intervals') {
      const intervalsNotes = (pw.notes ?? '') + INTERVALS_CUE
      workoutsToCreate.push({
        date,
        dayOfWeek,
        type: 'run',
        notes: intervalsNotes,
        runWorkout: {
          create: {
            workoutType: 'intervals',
            notes: intervalsNotes,
          },
        },
      })
    } else if (pw.type === 'active_recovery') {
      workoutsToCreate.push({
        date,
        dayOfWeek,
        type: 'mobility',
        notes: (pw.notes ?? '') + ACTIVE_RECOVERY_CUE,
      })
    }
  }

  // Fill any unprogrammed days with rest
  const programmedDayIndices = new Set(workoutsToCreate.map(w => w.dayOfWeek))
  for (let i = 0; i < 7; i++) {
    if (!programmedDayIndices.has(i)) {
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const { dayOfWeek, date } = getWorkoutDate(weekOf, dayNames[i])
      workoutsToCreate.push({ date, dayOfWeek, type: 'rest' })
    }
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
      } else if (w.type === 'mobility') {
        const eventId = await createAllDayCalendarEvent(personSlug, 'Mobility', w.date, `https://diverseydash.com/workout/mobility/${w.id}`)
        console.log(`  📅 Mobility calendar event created for ${w.date}: ${eventId ?? 'no ID'}`)
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
    } else if (w.type === 'mobility') {
      console.log(`  ${w.date} (${dayName}) — MOBILITY${w.notes ? ` · ${w.notes}` : ''}`)
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
