import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

import { PrismaClient } from '@prisma/client'
import { parsePdfWorkouts, getWorkoutDate } from '../services/workoutParsing'

const prisma = new PrismaClient()

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

  // Resolve personId for Jon
  const person = await prisma.person.findFirst({ where: { name: 'Jon' } })
  if (!person) {
    console.error('Person "Jon" not found in database. Run the seed first.')
    process.exit(1)
  }

  console.log(`\nParsing PDF: ${pdfPath}`)
  console.log(`Week of: ${weekOf}`)
  console.log(`Person: ${person.name} (${person.id})\n`)

  console.log('Sending to Claude for parsing…')
  const parsedWorkouts = await parsePdfWorkouts(pdfPath)
  console.log(`Claude returned ${parsedWorkouts.length} workout(s)\n`)

  // Upsert Athlete record
  const athlete = await prisma.athlete.upsert({
    where: { personId: person.id },
    create: { personId: person.id },
    update: {},
  })

  // Delete any existing week for this weekOf (idempotent re-import)
  const existing = await prisma.trainingWeek.findUnique({
    where: { athleteId_weekOf: { athleteId: athlete.id, weekOf } },
  })
  if (existing) {
    await prisma.trainingWeek.delete({ where: { id: existing.id } })
    console.log('Deleted existing training week for this date (re-importing)\n')
  }

  // Create TrainingWeek with nested Workouts → Exercises → Sets
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
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { sets: { orderBy: { setNumber: 'asc' } } },
          },
        },
      },
    },
  })

  // Print summary
  console.log(`✓ Training week created (id: ${week.id})\n`)
  for (const workout of week.workouts) {
    console.log(`  ${workout.date} (${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][workout.dayOfWeek]}) — ${workout.exercises.length} exercise(s)`)
    for (const ex of workout.exercises) {
      const setCount = ex.sets.length
      const sample = ex.sets[0]
      const sampleStr = sample
        ? `${sample.targetReps ?? '?'} reps @ RPE ${sample.targetRPE ?? '?'}${sample.tempo ? ` ${sample.tempo}` : ''}`
        : ''
      console.log(`    • [${ex.section}] ${ex.name} — ${setCount} set(s)${sampleStr ? ` (e.g. ${sampleStr})` : ''}`)
    }
    console.log()
  }

  await prisma.$disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
