import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const messagesResolvers = {
  Query: {
    activeMessage: async () => {
      const now = new Date()
      return prisma.message.findFirst({
        where: {
          isActive: true,
          OR: [
            { displayUntil: null },
            { displayUntil: { gt: now } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })
    },
  },

  Mutation: {
    createMessage: async (_: unknown, args: { author: string; body: string; displayUntil?: string }) => {
      await prisma.message.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
      return prisma.message.create({
        data: {
          author: args.author,
          body: args.body,
          displayUntil: args.displayUntil ? new Date(args.displayUntil) : null,
        },
      })
    },

    deactivateMessage: async (_: unknown, args: { id: string }) => {
      await prisma.message.update({
        where: { id: args.id },
        data: { isActive: false },
      })
      return true
    },
  },
}
