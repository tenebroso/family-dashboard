import { PrismaClient, Person } from '@prisma/client'
import { parseMessage } from '../services/messageParser'
import { createCalendarEvent } from '../services/calendarWriter'

const prisma = new PrismaClient()

export const messagesResolvers = {
  Query: {
    messages: async (_: unknown, args: { limit?: number; personSlug?: string }) => {
      const msgs = await prisma.message.findMany({
        where: args.personSlug ? { personSlug: args.personSlug } : undefined,
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

    if (parsed.type === 'chore' && parsed.choreTitle) {
      const targetSlug = parsed.personSlug ?? senderSlug
      const allPersons = await prisma.person.findMany()
      const person = allPersons.find((p: Person) => p.name.toLowerCase() === targetSlug.toLowerCase())
      console.log('[chore] title=%s slug=%s choreDateText=%s person=%s', parsed.choreTitle, targetSlug, parsed.choreDateText, person?.name ?? 'NOT FOUND')

      if (person) {
        const { oneTimeDate, dayOfWeek } = resolveChoreSchedule(parsed.choreDateText)
        console.log('[chore] oneTimeDate=%s dayOfWeek=%j', oneTimeDate, dayOfWeek)
        await prisma.chore.create({
          data: {
            title: parsed.choreTitle,
            personId: person.id,
            dayOfWeek: JSON.stringify(dayOfWeek),
            oneTimeDate: oneTimeDate ?? null,
          },
        })
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

function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function resolveChoreSchedule(choreDateText: string | undefined): { oneTimeDate: string | null; dayOfWeek: number[] } {
  const today = new Date()
  const todayKey = localDateKey(today)

  if (!choreDateText) return { oneTimeDate: todayKey, dayOfWeek: [] }

  const text = choreDateText.toLowerCase().trim()

  if (text === 'today') return { oneTimeDate: todayKey, dayOfWeek: [] }

  if (text === 'tomorrow') {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return { oneTimeDate: localDateKey(tomorrow), dayOfWeek: [] }
  }

  // "every day" or "daily" → recurring all days
  if (text === 'every day' || text === 'daily' || text === 'everyday') {
    return { oneTimeDate: null, dayOfWeek: [] }
  }

  // "weekdays" → Mon-Fri
  if (text === 'weekdays') return { oneTimeDate: null, dayOfWeek: [1, 2, 3, 4, 5] }

  // "weekends" → Sat-Sun
  if (text === 'weekends') return { oneTimeDate: null, dayOfWeek: [0, 6] }

  // "every monday" etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  for (let i = 0; i < dayNames.length; i++) {
    if (text.includes(dayNames[i])) return { oneTimeDate: null, dayOfWeek: [i] }
  }

  // ISO date string like "2024-03-15"
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { oneTimeDate: text, dayOfWeek: [] }

  // default: one-time today
  return { oneTimeDate: todayKey, dayOfWeek: [] }
}
