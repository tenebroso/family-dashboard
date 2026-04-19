const LAT = process.env.OPEN_METEO_LAT ?? '43.0389'
const LNG = process.env.OPEN_METEO_LNG ?? '-87.9065'

const WMO_LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Partly Cloudy', 2: 'Partly Cloudy', 3: 'Partly Cloudy',
  45: 'Foggy', 48: 'Foggy',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Rain',
  71: 'Snow', 73: 'Snow', 75: 'Snow',
  80: 'Showers', 81: 'Showers', 82: 'Showers',
  95: 'Thunderstorm',
}

export function interpretWeatherCode(code: number): string {
  return WMO_LABELS[code] ?? 'Cloudy'
}

interface WeatherData {
  current: {
    temp: number
    feelsLike: number
    conditionCode: number
    conditionLabel: string
    humidity: number
  }
  forecast: Array<{
    date: string
    tempHigh: number
    tempLow: number
    conditionCode: number
    conditionLabel: string
    precipitation: number
    precipitationProbability: number
  }>
}

let cache: { data: WeatherData; expiresAt: number } | null = null

export async function fetchWeather(): Promise<WeatherData> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', LAT)
  url.searchParams.set('longitude', LNG)
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weathercode,relativehumidity_2m')
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,precipitation_probability_max')
  url.searchParams.set('temperature_unit', 'fahrenheit')
  url.searchParams.set('wind_speed_unit', 'mph')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone', 'America/Chicago')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)
  const json = await res.json() as any

  const c = json.current
  const d = json.daily

  const data: WeatherData = {
    current: {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      conditionCode: c.weathercode,
      conditionLabel: interpretWeatherCode(c.weathercode),
      humidity: c.relativehumidity_2m,
    },
    forecast: (d.time as string[]).map((date: string, i: number) => ({
      date,
      tempHigh: Math.round(d.temperature_2m_max[i]),
      tempLow: Math.round(d.temperature_2m_min[i]),
      conditionCode: d.weathercode[i],
      conditionLabel: interpretWeatherCode(d.weathercode[i]),
      precipitation: Math.round(d.precipitation_sum[i] * 100) / 100,
      precipitationProbability: d.precipitation_probability_max[i] ?? 0,
    })),
  }

  cache = { data, expiresAt: Date.now() + 30 * 60 * 1000 }
  return data
}
