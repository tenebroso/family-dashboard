import { choreResolvers } from './chores'
import { calendarResolvers } from './calendar'
import { weatherResolvers } from './weather'
import { wordOfDayResolvers } from './wordOfDay'
import { tracksResolvers } from './tracks'
import { messagesResolvers } from './messages'

export const resolvers = {
  Query: {
    ...choreResolvers.Query,
    ...calendarResolvers.Query,
    ...weatherResolvers.Query,
    ...wordOfDayResolvers.Query,
    ...tracksResolvers.Query,
    ...messagesResolvers.Query,
  },

  Person: choreResolvers.Person,
  Chore: choreResolvers.Chore,

  Mutation: {
    ...choreResolvers.Mutation,
    ...messagesResolvers.Mutation,
  },
}
