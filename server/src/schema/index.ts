import { personTypeDefs } from './types/person.graphql'
import { choreTypeDefs } from './types/chore.graphql'
import { calendarTypeDefs } from './types/calendar.graphql'
import { weatherTypeDefs } from './types/weather.graphql'
import { messageTypeDefs } from './types/message.graphql'
import { trackTypeDefs } from './types/track.graphql'
import { wordTypeDefs } from './types/word.graphql'

const rootTypeDefs = `#graphql
  type Query {
    people: [Person!]!
    person(id: ID!): Person
    calendarEvents(start: String!, end: String!): [CalendarEvent!]!
    weather: WeatherData!
    activeMessage: Message
    dailyTrack: Track!
    wordOfDay: WordOfDay!
  }

  type Mutation {
    completeChore(choreId: ID!, dateKey: String!): ChoreCompletion!
    uncompleteChore(choreId: ID!, dateKey: String!): Boolean!
    createChore(input: CreateChoreInput!): Chore!
    updateChore(input: UpdateChoreInput!): Chore!
    deleteChore(id: ID!): Boolean!
    createMessage(author: String!, body: String!, displayUntil: String): Message!
  }
`

export const typeDefs = [
  rootTypeDefs,
  personTypeDefs,
  choreTypeDefs,
  calendarTypeDefs,
  weatherTypeDefs,
  messageTypeDefs,
  trackTypeDefs,
  wordTypeDefs,
]
