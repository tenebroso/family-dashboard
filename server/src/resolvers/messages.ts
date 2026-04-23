import { PrismaClient } from '@prisma/client'
import { parseMessage } from '../services/messageParser'
import { createCalendarEvent } from '../services/calendarWriter'

const prisma = new PrismaClient()

export const messagesResolvers = {
  Query: {
    messages: async (_: unknown, args: { limit?: number }) => {
      const msgs = await prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        take: args.limit ?? 50,
      })
      return msgs.reverse()
    },
  },

  Mutation: {
    deleteMessage: async (_: unknown, args: { id: string }) => {
      await prisma.message.delete({ where: { id: args.id } })
      return true
    },

    sendMessage: async (_: unknown, args: { body: string; personSlug: string }) => {
      const message = await prisma.message.create({
        data: { body: args.body, personSlug: args.personSlug },
      })

      await parseAndDispatch(message.id, args.body, args.personSlug)

      return prisma.message.findUniqueOrThrow({ where: { id: message.id } })
    },
  },
}

async function parseAndDispatch(messageId: string, body: string, senderSlug: string) {
  try {
    const parsed = await parseMessage(body, senderSlug)

    await prisma.message.update({
      where: { id: messageId },
      data: { parsedType: parsed.type },
    })

    if (parsed.type === 'grocery' && parsed.item) {
      await prisma.groceryItem.create({
        data: {
          name: parsed.item,
          quantity: parsed.quantity ?? null,
          addedBy: senderSlug,
        },
      })
      await prisma.message.update({
        where: { id: messageId },
        data: { parsedDone: true },
      })
    }

    if (parsed.type === 'reminder' && parsed.eventTitle && parsed.dateText) {
      const targetPerson = parsed.personSlug ?? senderSlug
      const eventId = await createCalendarEvent(targetPerson, parsed.eventTitle, parsed.dateText)
      if (eventId) {
        await prisma.message.update({
          where: { id: messageId },
          data: { parsedDone: true },
        })
      }
    }
  } catch (err) {
    console.error('[dispatch] unhandled error:', err)
  }
}
