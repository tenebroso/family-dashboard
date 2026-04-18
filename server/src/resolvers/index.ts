import { choreResolvers } from './chores'
import { calendarResolvers } from './calendar'

const now = new Date()
const day = (offset: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

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

export const resolvers = {
  Query: {
    ...choreResolvers.Query,
    ...calendarResolvers.Query,
    weather: () => STUB_WEATHER,
    activeMessage: () => ({
      id: 'm1',
      author: 'Mom',
      body: "Don't forget: soccer practice at 4pm today!",
      displayUntil: null,
      createdAt: now.toISOString(),
    }),
    dailyTrack: () => ({ id: 't1', title: 'Golden Hour', artist: 'JVKE', url: '/music/golden-hour.mp3' }),
    wordOfDay: () => ({ word: 'ephemeral', partOfSpeech: 'adjective', definition: 'Lasting for a very short time.' }),
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
