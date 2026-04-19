import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const messagesResolvers = {
  Query: {
    messages: async (_: unknown, args: { limit?: number }) => {
      return prisma.message.findMany({
        orderBy: { createdAt: 'asc' },
        take: args.limit ?? 50,
      })
    },
  },

  Mutation: {
    sendMessage: async (_: unknown, args: { body: string; personSlug: string }) => {
      return prisma.message.create({
        data: {
          body: args.body,
          personSlug: args.personSlug,
        },
      })
    },
  },
}
