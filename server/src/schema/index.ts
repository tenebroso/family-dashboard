import { personTypeDefs } from './types/person.graphql'
import { choreTypeDefs } from './types/chore.graphql'
import { calendarTypeDefs } from './types/calendar.graphql'
import { weatherTypeDefs } from './types/weather.graphql'
import { messageTypeDefs } from './types/message.graphql'
import { trackTypeDefs } from './types/track.graphql'
import { wordTypeDefs } from './types/word.graphql'
import { groceryTypeDefs } from './types/grocery.graphql'
import { reminderTypeDefs } from './types/reminder.graphql'

const rootTypeDefs = `#graphql
  type Query {
    people: [Person!]!
    person(id: ID!): Person
    calendarEvents(start: String!, end: String!): [CalendarEvent!]!
    weather: WeatherData!
    messages(limit: Int): [Message!]!
    dailyTrack: Track!
    wordOfDay: WordOfDay!
    groceryItems: [GroceryItem!]!
    reminders(personId: ID!): [Reminder!]!
  }

  type Mutation {
    completeChore(choreId: ID!, dateKey: String!): ChoreCompletion!
    uncompleteChore(choreId: ID!, dateKey: String!): Boolean!
    createChore(input: CreateChoreInput!): Chore!
    updateChore(input: UpdateChoreInput!): Chore!
    deleteChore(id: ID!): Boolean!
    sendMessage(body: String!, personSlug: String!): Message!
    deleteMessage(id: ID!): Boolean!
    addGroceryItem(name: String!, quantity: String, category: String, addedBy: String!): GroceryItem!
    toggleGroceryItem(id: ID!): GroceryItem!
    deleteGroceryItem(id: ID!): Boolean!
    clearCheckedGroceryItems: Int!
    addReminder(personId: ID!, text: String!, dueDate: String): Reminder!
    toggleReminder(id: ID!): Reminder!
    deleteReminder(id: ID!): Boolean!
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
  groceryTypeDefs,
  reminderTypeDefs,
]
