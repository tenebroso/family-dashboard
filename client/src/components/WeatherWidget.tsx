import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import Skeleton from './Skeleton'

const WEATHER_QUERY = gql`
  query WeatherWidget {
    weather {
      current {
        temp
        feelsLike
        conditionCode
        conditionLabel
        humidity
      }
      forecast {
        date
        tempHigh
        tempLow
        conditionCode
        conditionLabel
        precipitation
      }
    }
  }
`

function SunIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="wi" style={{ color: 'var(--accent-ink)' }}
      fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const r1 = 14, r2 = 18
        const x1 = 24 + r1 * Math.cos(a * Math.PI / 180)
        const y1 = 24 + r1 * Math.sin(a * Math.PI / 180)
        const x2 = 24 + r2 * Math.cos(a * Math.PI / 180)
        const y2 = 24 + r2 * Math.sin(a * Math.PI / 180)
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
    </svg>
  )
}

function CloudIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="wi" style={{ color: 'var(--ink-3)' }}
      fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 30c-3 0-6-2.5-6-6 0-3.2 2.6-5.8 5.8-5.8.5 0 1 .05 1.4.15C16.5 15 19.5 13 23 13c4.5 0 8 3.5 8 8 0 .3 0 .7-.05 1C33.6 22.2 36 24.5 36 27.5c0 3-2.5 5.5-5.5 5.5H14z" />
    </svg>
  )
}

function CloudSunIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="wi" style={{ color: 'var(--accent-ink)' }}
      fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* sun */}
      <circle cx="30" cy="16" r="5" />
      <line x1="30" y1="8" x2="30" y2="10" />
      <line x1="30" y1="22" x2="30" y2="24" />
      <line x1="22" y1="16" x2="24" y2="16" />
      <line x1="36" y1="16" x2="38" y2="16" />
      <line x1="24.34" y1="10.34" x2="25.75" y2="11.75" />
      <line x1="34.25" y1="20.25" x2="35.66" y2="21.66" />
      <line x1="24.34" y1="21.66" x2="25.75" y2="20.25" />
      <line x1="34.25" y1="11.75" x2="35.66" y2="10.34" />
      {/* cloud */}
      <path d="M14 34c-3.5 0-6-2.8-6-6.5s2.8-6.5 6.2-6.5c.4 0 .8.04 1.2.12C17 18 20 16 24 16c5 0 9 4 9 9 0 .4 0 .8-.06 1.2C35.5 26.5 38 29 38 32c0 3.3-2.7 6-6 6H14z" />
    </svg>
  )
}

function RainIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="wi" style={{ color: 'var(--ink-3)' }}
      fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 24c-3 0-6-2.5-6-6 0-3.2 2.6-5.8 5.8-5.8.5 0 1 .05 1.4.15C16.5 9 19.5 7 23 7c4.5 0 8 3.5 8 8 0 .3 0 .7-.05 1C33.6 16.2 36 18.5 36 21.5c0 3-2.5 5.5-5.5 5.5H14z" />
      <line x1="16" y1="32" x2="14" y2="38" />
      <line x1="24" y1="32" x2="22" y2="38" />
      <line x1="32" y1="32" x2="30" y2="38" />
    </svg>
  )
}

function SnowIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="wi" style={{ color: 'var(--p-jon)' }}
      fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 24c-3 0-6-2.5-6-6 0-3.2 2.6-5.8 5.8-5.8.5 0 1 .05 1.4.15C16.5 9 19.5 7 23 7c4.5 0 8 3.5 8 8 0 .3 0 .7-.05 1C33.6 16.2 36 18.5 36 21.5c0 3-2.5 5.5-5.5 5.5H14z" />
      <line x1="16" y1="32" x2="16" y2="38" />
      <line x1="24" y1="32" x2="24" y2="38" />
      <line x1="32" y1="32" x2="32" y2="38" />
    </svg>
  )
}

function StormIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="wi" style={{ color: 'var(--ink-3)' }}
      fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 24c-3 0-6-2.5-6-6 0-3.2 2.6-5.8 5.8-5.8.5 0 1 .05 1.4.15C16.5 9 19.5 7 23 7c4.5 0 8 3.5 8 8 0 .3 0 .7-.05 1C33.6 16.2 36 18.5 36 21.5c0 3-2.5 5.5-5.5 5.5H14z" />
      <polyline points="22 30 20 36 23 36 21 42" />
    </svg>
  )
}

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Clear: SunIcon,
  'Partly Cloudy': CloudSunIcon,
  Cloudy: CloudIcon,
  Foggy: CloudIcon,
  Drizzle: RainIcon,
  Rain: RainIcon,
  Showers: RainIcon,
  Snow: SnowIcon,
  Thunderstorm: StormIcon,
}

function WeatherIcon({ condition, size = 48 }: { condition: string; size?: number }) {
  const Icon = ICONS[condition] ?? CloudIcon
  return <Icon size={size} />
}

function SmallWeatherIcon({ condition }: { condition: string }) {
  const Icon = ICONS[condition] ?? CloudIcon
  return <Icon size={20} />
}

function dayAbbr(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

interface WCurrent { temp: number; feelsLike: number; conditionCode: number; conditionLabel: string; humidity: number }
interface WDay { date: string; tempHigh: number; tempLow: number; conditionCode: number; conditionLabel: string; precipitation: number }

export default function WeatherWidget() {
  const { data, loading } = useQuery<{ weather: { current: WCurrent; forecast: WDay[] } }>(WEATHER_QUERY)
  const current = data?.weather?.current
  const forecast = (data?.weather?.forecast ?? []).slice(0, 4)

  return (
    <div className="tile weather-tile">
      <div className="tile-eyebrow">Weather · Milwaukee</div>

      {loading || !current ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-36 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
      ) : (
        <>
          <div className="weather-main">
            <div>
              <div className="weather-temp">
                {current.temp}<span className="weather-temp-deg">°</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="weather-cond-now">{current.conditionLabel}</div>
                <div className="weather-cond-range">
                  Feels {current.feelsLike}° · {current.humidity}% humidity
                </div>
              </div>
            </div>
            <WeatherIcon condition={current.conditionLabel} size={64} />
          </div>
        </>
      )}

      <div className="weather-forecast-strip">
        {loading || forecast.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="forecast-day-item">
              <Skeleton className="w-full h-14 rounded" />
            </div>
          ))
        ) : (
          forecast.map((day: any) => (
            <div key={day.date} className="forecast-day-item">
              <span className="forecast-day-name">{dayAbbr(day.date)}</span>
              <SmallWeatherIcon condition={day.conditionLabel} />
              <span className="forecast-day-temp">{day.tempHigh}°</span>
              <span style={{ fontSize: 11, color: 'var(--ink-4)', fontVariantNumeric: 'tabular-nums' }}>
                {day.tempLow}°
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
