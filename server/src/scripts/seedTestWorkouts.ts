import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_WEEK_MAIN = '2020-01-13'
const TEST_WEEK_EMPTY = '2020-01-20'

async function main() {
  const person = await prisma.person.findFirst({ where: { name: 'Jon' } })
  if (!person) throw new Error('Person "Jon" not found in database')

  let athlete = await prisma.athlete.findUnique({ where: { personId: person.id } })
  if (!athlete) {
    athlete = await prisma.athlete.create({ data: { personId: person.id } })
  }

  // Always delete and recreate the main test week for a clean, predictable state
  await prisma.trainingWeek.deleteMany({ where: { athleteId: athlete.id, weekOf: TEST_WEEK_MAIN } })

  const mainWeek = await prisma.trainingWeek.create({
    data: { athleteId: athlete.id, weekOf: TEST_WEEK_MAIN },
  })

  // Monday 2020-01-13: Strength A — used by chromium for "log actuals" tests
  const strengthWorkout = await prisma.workout.create({
    data: { trainingWeekId: mainWeek.id, date: '2020-01-13', dayOfWeek: 1, type: 'strength', notes: 'Strength A' },
  })

  const squat = await prisma.strengthExercise.create({
    data: { workoutId: strengthWorkout.id, name: 'Barbell Squat', section: 'Strength', order: 0 },
  })
  let firstSetId = ''
  let secondSetId = ''
  let thirdSetId = ''
  for (let i = 1; i <= 3; i++) {
    const set = await prisma.strengthSet.create({
      data: { exerciseId: squat.id, setNumber: i, targetReps: '8', targetWeight: 135, targetRPE: '7' },
    })
    if (i === 1) firstSetId = set.id
    if (i === 2) secondSetId = set.id
    if (i === 3) thirdSetId = set.id
  }

  const bench = await prisma.strengthExercise.create({
    data: { workoutId: strengthWorkout.id, name: 'Bench Press', section: 'Strength', order: 1 },
  })
  for (let i = 1; i <= 3; i++) {
    await prisma.strengthSet.create({
      data: { exerciseId: bench.id, setNumber: i, targetReps: '10', targetWeight: 95, targetRPE: '7' },
    })
  }

  // Tuesday 2020-01-14: Run A — used by chromium for "run workout" tests
  const runWorkout = await prisma.workout.create({
    data: { trainingWeekId: mainWeek.id, date: '2020-01-14', dayOfWeek: 2, type: 'run', notes: 'Easy Run' },
  })
  await prisma.runWorkout.create({
    data: { workoutId: runWorkout.id, targetMiles: 4, targetPace: '9:30', heartRateZone: 'Zone 2', workoutType: 'easy' },
  })

  // Wednesday 2020-01-15: Rest day
  const restWorkout = await prisma.workout.create({
    data: { trainingWeekId: mainWeek.id, date: '2020-01-15', dayOfWeek: 3, type: 'rest' },
  })

  // Thursday 2020-01-16: Yoga day
  const yogaWorkout = await prisma.workout.create({
    data: { trainingWeekId: mainWeek.id, date: '2020-01-16', dayOfWeek: 4, type: 'yoga' },
  })

  // Friday 2020-01-17: Strength B — used by mobile-chrome for "log actuals" tests
  // A separate workout prevents cross-browser races when one project completes the workout
  // while the other is still running its tests on it.
  const strengthWorkout2 = await prisma.workout.create({
    data: { trainingWeekId: mainWeek.id, date: '2020-01-17', dayOfWeek: 5, type: 'strength', notes: 'Strength B' },
  })
  const squat2 = await prisma.strengthExercise.create({
    data: { workoutId: strengthWorkout2.id, name: 'Barbell Squat', section: 'Strength', order: 0 },
  })
  for (let i = 1; i <= 3; i++) {
    await prisma.strengthSet.create({
      data: { exerciseId: squat2.id, setNumber: i, targetReps: '8', targetWeight: 135, targetRPE: '7' },
    })
  }
  const bench2 = await prisma.strengthExercise.create({
    data: { workoutId: strengthWorkout2.id, name: 'Bench Press', section: 'Strength', order: 1 },
  })
  for (let i = 1; i <= 3; i++) {
    await prisma.strengthSet.create({
      data: { exerciseId: bench2.id, setNumber: i, targetReps: '10', targetWeight: 95, targetRPE: '7' },
    })
  }

  // Saturday 2020-01-18: Run B — used by mobile-chrome for "run workout" tests
  const runWorkout2 = await prisma.workout.create({
    data: { trainingWeekId: mainWeek.id, date: '2020-01-18', dayOfWeek: 6, type: 'run', notes: 'Easy Run 2' },
  })
  await prisma.runWorkout.create({
    data: { workoutId: runWorkout2.id, targetMiles: 4, targetPace: '9:30', heartRateZone: 'Zone 2', workoutType: 'easy' },
  })

  // Always delete the empty test week so creation tests have a clean slate
  await prisma.trainingWeek.deleteMany({ where: { athleteId: athlete.id, weekOf: TEST_WEEK_EMPTY } })

  const testData = {
    testWeek: TEST_WEEK_MAIN,
    emptyWeek: TEST_WEEK_EMPTY,
    strengthWorkoutId: strengthWorkout.id,
    strengthWorkoutId2: strengthWorkout2.id,
    runWorkoutId: runWorkout.id,
    runWorkoutId2: runWorkout2.id,
    restWorkoutId: restWorkout.id,
    yogaWorkoutId: yogaWorkout.id,
    firstSetId,
    secondSetId,
    thirdSetId,
  }

  const outPath = path.join(__dirname, '..', '..', '..', 'e2e', 'test-data.json')
  fs.writeFileSync(outPath, JSON.stringify(testData, null, 2))
  console.log('✓ Seeded test workouts:', JSON.stringify(testData))
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
