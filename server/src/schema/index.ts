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

const STUB_PEOPLE = [
  {
    id: 'harry',
    name: 'Harry',
    color: '#4A90D9',
    chores: [
      { id: 'c1', title: 'Make bed', personId: 'harry', dayOfWeek: [], isActive: true },
      { id: 'c2', title: 'Feed dog', personId: 'harry', dayOfWeek: [1, 3, 5], isActive: true },
    ],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    color: '#E8607A',
    chores: [
      { id: 'c3', title: 'Make bed', personId: 'ruby', dayOfWeek: [], isActive: true },
      { id: 'c4', title: 'Set the table', personId: 'ruby', dayOfWeek: [1, 2, 3, 4, 5], isActive: true },
    ],
  },
  {
    id: 'krysten',
    name: 'Krysten',
    color: '#7BC67E',
    chores: [
      { id: 'c5', title: 'Grocery shopping', personId: 'krysten', dayOfWeek: [6], isActive: true },
      { id: 'c6', title: 'Laundry', personId: 'krysten', dayOfWeek: [2, 5], isActive: true },
    ],
  },
  {
    id: 'jon',
    name: 'Jon',
    color: '#C9A84C',
    chores: [
      { id: 'c7', title: 'Walk dog', personId: 'jon', dayOfWeek: [], isActive: true },
      { id: 'c8', title: 'Mow lawn', personId: 'jon', dayOfWeek: [6], isActive: true },
    ],
  },
]

const now = new Date()
const day = (offset: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

const STUB_CALENDAR_EVENTS = [
  { id: 'e1', title: 'Soccer practice', start: day(1), end: day(1), allDay: false, description: null, color: '#4A90D9' },
  { id: 'e2', title: 'Dentist - Ruby', start: day(3), end: day(3), allDay: false, description: null, color: '#E8607A' },
  { id: 'e3', title: 'Family dinner', start: day(5), end: day(5), allDay: true, description: 'At Grandma\'s', color: '#C9A84C' },
  { id: 'e4', title: 'Grocery run', start: day(8), end: day(8), allDay: false, description: null, color: '#7BC67E' },
  { id: 'e5', title: "Harry's birthday", start: day(12), end: day(12), allDay: true, description: null, color: '#4A90D9' },
]

const STUB_WEATHER = {
  current: { temp: 68, feelsLike: 65, conditionCode: 2, conditionLabel: 'Partly Cloudy', humidity: 55 },
  forecast: [
    { date: day(0), tempHigh: 72, tempLow: 58, conditionCode: 0, conditionLabel: 'Clear', precipitation: 0 },
    { date: day(1), tempHigh: 68, tempLow: 55, conditionCode: 2, conditionLabel: 'Partly Cloudy', precipitation: 0.1 },
    { date: day(2), tempHigh: 61, tempLow: 52, conditionCode: 61, conditionLabel: 'Rain', precipitation: 0.8 },
    { date: day(3), tempHigh: 64, tempLow: 50, conditionCode: 80, conditionLabel: 'Showers', precipitation: 0.4 },
    { date: day(4), tempHigh: 70, tempLow: 54, conditionCode: 1, conditionLabel: 'Partly Cloudy', precipitation: 0 },
    { date: day(5), tempHigh: 75, tempLow: 60, conditionCode: 0, conditionLabel: 'Clear', precipitation: 0 },
    { date: day(6), tempHigh: 73, tempLow: 59, conditionCode: 0, conditionLabel: 'Clear', precipitation: 0 },
  ],
}

const STUB_MESSAGE = {
  id: 'm1',
  author: 'Mom',
  body: "Don't forget: soccer practice at 4pm today!",
  displayUntil: null,
  createdAt: now.toISOString(),
}

const STUB_TRACK = {
  id: 't1',
  title: 'Golden Hour',
  artist: 'JVKE',
  url: '/music/golden-hour.mp3',
}

const STUB_WORD = {
  word: 'ephemeral',
  partOfSpeech: 'adjective',
  definition: 'Lasting for a very short time.',
}

const STUB_CHORE_FOR_PERSON = (personId: string) =>
  STUB_PEOPLE.find((p) => p.id === personId)?.chores ?? []

export const resolvers = {
  Query: {
    people: () => STUB_PEOPLE,
    person: (_: unknown, { id }: { id: string }) => STUB_PEOPLE.find((p) => p.id === id) ?? null,
    calendarEvents: () => STUB_CALENDAR_EVENTS,
    weather: () => STUB_WEATHER,
    activeMessage: () => STUB_MESSAGE,
    dailyTrack: () => STUB_TRACK,
    wordOfDay: () => STUB_WORD,
  },

  Person: {
    chores: (parent: { id: string }) => STUB_CHORE_FOR_PERSON(parent.id),
    completionRate: () => 0.0,
  },

  Chore: {
    person: (parent: { personId: string }) => STUB_PEOPLE.find((p) => p.id === parent.personId),
    isCompletedOn: () => false,
  },

  Mutation: {
    completeChore: (_: unknown, { choreId, dateKey }: { choreId: string; dateKey: string }) => ({
      id: `comp-${choreId}-${dateKey}`,
      choreId,
      dateKey,
      completedAt: new Date().toISOString(),
    }),
    uncompleteChore: () => true,
    createChore: (_: unknown, { input }: { input: { title: string; personId: string; dayOfWeek: number[] } }) => ({
      id: `new-chore-${Date.now()}`,
      title: input.title,
      personId: input.personId,
      person: STUB_PEOPLE.find((p) => p.id === input.personId),
      dayOfWeek: input.dayOfWeek,
      isActive: true,
    }),
    updateChore: (_: unknown, { input }: { input: { id: string; title?: string; dayOfWeek?: number[]; isActive?: boolean } }) => ({
      id: input.id,
      title: input.title ?? 'Updated Chore',
      personId: 'harry',
      person: STUB_PEOPLE[0],
      dayOfWeek: input.dayOfWeek ?? [],
      isActive: input.isActive ?? true,
    }),
    deleteChore: () => true,
    createMessage: (_: unknown, args: { author: string; body: string; displayUntil?: string }) => ({
      id: `msg-${Date.now()}`,
      author: args.author,
      body: args.body,
      displayUntil: args.displayUntil ?? null,
      createdAt: new Date().toISOString(),
    }),
  },
}
