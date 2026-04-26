import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [r1, r2, r3, r4, r5, r6] = await prisma.$transaction([
    prisma.strengthSet.deleteMany(),
    prisma.strengthExercise.deleteMany(),
    prisma.runWorkout.deleteMany(),
    prisma.workout.deleteMany(),
    prisma.trainingWeek.deleteMany(),
    prisma.athlete.deleteMany(),
  ])

  console.log(`Deleted:`)
  console.log(`  ${r1.count} strength sets`)
  console.log(`  ${r2.count} strength exercises`)
  console.log(`  ${r3.count} run workouts`)
  console.log(`  ${r4.count} workouts`)
  console.log(`  ${r5.count} training weeks`)
  console.log(`  ${r6.count} athletes`)
  console.log('Done.')

  await prisma.$disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
