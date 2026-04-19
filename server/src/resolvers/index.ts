import { choreResolvers } from './chores'
import { calendarResolvers } from './calendar'
import { weatherResolvers } from './weather'
import { wordOfDayResolvers } from './wordOfDay'
import { tracksResolvers } from './tracks'

const now = new Date()

export const resolvers = {
  Query: {
    ...choreResolvers.Query,
    ...calendarResolvers.Query,
    ...weatherResolvers.Query,
    ...wordOfDayResolvers.Query,
    ...tracksResolvers.Query,
    activeMessage: () => ({
      id: 'm1',
      author: 'Mom',
      body: "Don't forget: soccer practice at 4pm today!",
      displayUntil: null,
      createdAt: now.toISOString(),
    }),
  },

  Person: choreResolvers.Person,
  Chore: choreResolvers.Chore,

  Mutation: {
    ...choreResolvers.Mutation,
    createMessage: (_: unknown, args: { author: string; body: string; displayUntil?: string }) => ({
      id: `msg-${Date.now()}`,
      author: args.author,
      body: args.body,
      displayUntil: args.displayUntil ?? null,
      createdAt: new Date().toISOString(),
    }),
  },
}
