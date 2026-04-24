import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type PersonParent = { id: string }
type ChoreParent = { id: string; personId: string; dayOfWeek: string; oneTimeDate: string | null }

function parseDayOfWeek(raw: string): number[] {
  try { return JSON.parse(raw) } catch { return [] }
}

export const choreResolvers = {
  Query: {
    people: () => prisma.person.findMany({ orderBy: { name: 'asc' } }),
    person: (_: unknown, { id }: { id: string }) =>
      prisma.person.findUnique({ where: { id } }),
  },

  Person: {
    chores: async (parent: PersonParent, { dayOfWeek, dateKey }: { dayOfWeek?: number; dateKey?: string }) => {
      const chores = await prisma.chore.findMany({
        where: { personId: parent.id, isActive: true },
      })
      if (dayOfWeek === undefined || dayOfWeek === null) return chores
      return chores.filter(c => {
        if (c.oneTimeDate) return dateKey ? c.oneTimeDate === dateKey : false
        const days = parseDayOfWeek(c.dayOfWeek)
        return days.length === 0 || days.includes(dayOfWeek)
      })
    },
    completionRate: async (parent: PersonParent, { dateKey }: { dateKey: string }) => {
      const dow = new Date(`${dateKey}T12:00:00`).getDay()
      const chores = await prisma.chore.findMany({
        where: { personId: parent.id, isActive: true },
      })
      const scheduled = chores.filter(c => {
        if (c.oneTimeDate) return c.oneTimeDate === dateKey
        const days = parseDayOfWeek(c.dayOfWeek)
        return days.length === 0 || days.includes(dow)
      })
      if (scheduled.length === 0) return 0.0
      const completions = await prisma.choreCompletion.count({
        where: { choreId: { in: scheduled.map(c => c.id) }, dateKey },
      })
      return completions / scheduled.length
    },
  },

  Chore: {
    person: (parent: ChoreParent) =>
      prisma.person.findUnique({ where: { id: parent.personId } }),
    dayOfWeek: (parent: ChoreParent) => parseDayOfWeek(parent.dayOfWeek),
    isCompletedOn: async (parent: ChoreParent, { dateKey }: { dateKey: string }) => {
      const c = await prisma.choreCompletion.findUnique({
        where: { choreId_dateKey: { choreId: parent.id, dateKey } },
      })
      return c !== null
    },
  },

  Mutation: {
    completeChore: (_: unknown, { choreId, dateKey }: { choreId: string; dateKey: string }) =>
      prisma.choreCompletion.upsert({
        where: { choreId_dateKey: { choreId, dateKey } },
        create: { choreId, dateKey },
        update: {},
      }),
    uncompleteChore: async (_: unknown, { choreId, dateKey }: { choreId: string; dateKey: string }) => {
      await prisma.choreCompletion.deleteMany({ where: { choreId, dateKey } })
      return true
    },
    createChore: (_: unknown, { input }: { input: { title: string; personId: string; dayOfWeek: number[] } }) =>
      prisma.chore.create({
        data: { title: input.title, personId: input.personId, dayOfWeek: JSON.stringify(input.dayOfWeek) },
      }),
    updateChore: (_: unknown, { input }: { input: { id: string; title?: string; dayOfWeek?: number[]; isActive?: boolean } }) =>
      prisma.chore.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.dayOfWeek !== undefined && { dayOfWeek: JSON.stringify(input.dayOfWeek) }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      }),
    deleteChore: async (_: unknown, { id }: { id: string }) => {
      await prisma.chore.update({ where: { id }, data: { isActive: false } })
      return true
    },
  },
}
