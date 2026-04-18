import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.choreCompletion.deleteMany()
  await prisma.chore.deleteMany()
  await prisma.person.deleteMany()

  const harry = await prisma.person.create({ data: { name: 'Harry', color: '#4A90D9' } })
  const ruby = await prisma.person.create({ data: { name: 'Ruby', color: '#E8607A' } })
  const krysten = await prisma.person.create({ data: { name: 'Krysten', color: '#7BC67E' } })
  const jon = await prisma.person.create({ data: { name: 'Jon', color: '#C9A84C' } })

  const chores = [
    { title: 'Make bed', personId: harry.id, dayOfWeek: JSON.stringify([]) },
    { title: 'Feed dog', personId: harry.id, dayOfWeek: JSON.stringify([1, 3, 5]) },
    { title: 'Take out trash', personId: harry.id, dayOfWeek: JSON.stringify([0, 3]) },

    { title: 'Make bed', personId: ruby.id, dayOfWeek: JSON.stringify([]) },
    { title: 'Set the table', personId: ruby.id, dayOfWeek: JSON.stringify([1, 2, 3, 4, 5]) },
    { title: 'Vacuum living room', personId: ruby.id, dayOfWeek: JSON.stringify([6]) },

    { title: 'Grocery shopping', personId: krysten.id, dayOfWeek: JSON.stringify([6]) },
    { title: 'Laundry', personId: krysten.id, dayOfWeek: JSON.stringify([2, 5]) },
    { title: 'Meal prep', personId: krysten.id, dayOfWeek: JSON.stringify([0]) },

    { title: 'Walk dog', personId: jon.id, dayOfWeek: JSON.stringify([]) },
    { title: 'Mow lawn', personId: jon.id, dayOfWeek: JSON.stringify([6]) },
    { title: 'Pay bills', personId: jon.id, dayOfWeek: JSON.stringify([1]) },
  ]

  for (const chore of chores) {
    await prisma.chore.create({ data: chore })
  }

  console.log('Seeded 4 people and 12 chores.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
