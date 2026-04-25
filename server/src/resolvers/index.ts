import { choreResolvers } from './chores'
import { calendarResolvers } from './calendar'
import { weatherResolvers } from './weather'
import { wordOfDayResolvers } from './wordOfDay'
import { tracksResolvers } from './tracks'
import { messagesResolvers } from './messages'
import { groceryResolvers } from './grocery'
import { remindersResolvers } from './reminders'
import { workoutResolvers } from './workouts'

export const resolvers = {
  Query: {
    ...choreResolvers.Query,
    ...calendarResolvers.Query,
    ...weatherResolvers.Query,
    ...wordOfDayResolvers.Query,
    ...tracksResolvers.Query,
    ...messagesResolvers.Query,
    ...groceryResolvers.Query,
    ...remindersResolvers.Query,
    ...workoutResolvers.Query,
  },

  Person: {
    ...choreResolvers.Person,
    ...remindersResolvers.Person,
  },
  Chore: choreResolvers.Chore,

  Mutation: {
    ...choreResolvers.Mutation,
    ...messagesResolvers.Mutation,
    ...groceryResolvers.Mutation,
    ...remindersResolvers.Mutation,
    ...workoutResolvers.Mutation,
  },
}
