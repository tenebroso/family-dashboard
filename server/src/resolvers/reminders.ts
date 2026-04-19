import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function mapReminder(r: { id: string; personId: string; text: string; dueDate: string | null; done: boolean; createdAt: Date }) {
  return { ...r, createdAt: r.createdAt.toISOString() }
}

export const remindersResolvers = {
  Query: {
    reminders: async (_: unknown, { personId }: { personId: string }) => {
      const items = await prisma.reminder.findMany({
        where: { personId },
        orderBy: [{ done: 'asc' }, { createdAt: 'asc' }],
      })
      return items.map(mapReminder)
    },
  },

  Person: {
    reminders: async (person: { id: string }) => {
      const items = await prisma.reminder.findMany({
        where: { personId: person.id },
        orderBy: [{ done: 'asc' }, { createdAt: 'asc' }],
      })
      return items.map(mapReminder)
    },
  },

  Mutation: {
    addReminder: async (
      _: unknown,
      args: { personId: string; text: string; dueDate?: string }
    ) => {
      const item = await prisma.reminder.create({ data: args })
      return mapReminder(item)
    },

    toggleReminder: async (_: unknown, { id }: { id: string }) => {
      const item = await prisma.reminder.findUniqueOrThrow({ where: { id } })
      const updated = await prisma.reminder.update({
        where: { id },
        data: { done: !item.done },
      })
      return mapReminder(updated)
    },

    deleteReminder: async (_: unknown, { id }: { id: string }) => {
      await prisma.reminder.delete({ where: { id } })
      return true
    },
  },
}
