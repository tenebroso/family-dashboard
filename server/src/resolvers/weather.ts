import { fetchWeather } from '../services/weather'

const STUB_WEATHER = {
  current: { temp: 68, feelsLike: 65, conditionCode: 2, conditionLabel: 'Partly Cloudy', humidity: 55 },
  forecast: Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      date: d.toISOString().slice(0, 10),
      tempHigh: 72 - i,
      tempLow: 55,
      conditionCode: 0,
      conditionLabel: 'Clear',
      precipitation: 0,
    }
  }),
}

export const weatherResolvers = {
  Query: {
    weather: async () => {
      try {
        return await fetchWeather()
      } catch (err) {
        console.error('Weather API error, using stub:', err)
        return STUB_WEATHER
      }
    },
  },
}
