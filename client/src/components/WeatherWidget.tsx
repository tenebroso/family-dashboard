import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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

const CONDITION_ICONS: Record<string, LucideIcon> = {
  Clear: Sun,
  'Partly Cloudy': CloudSun,
  Cloudy: Cloud,
  Foggy: Cloud,
  Drizzle: CloudRain,
  Rain: CloudRain,
  Showers: CloudRain,
  Snow: CloudSnow,
  Thunderstorm: CloudLightning,
}

function WeatherIcon({ condition, size = 16 }: { condition: string; size?: number }) {
  const Icon = CONDITION_ICONS[condition] ?? Cloud
  return <Icon size={size} className="text-ink-muted" />
}

function dayAbbr(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function isToday(dateStr: string) {
  return new Date().toISOString().slice(0, 10) === dateStr
}

export default function WeatherWidget() {
  const { data, loading } = useQuery(WEATHER_QUERY)
  const current = data?.weather?.current
  const forecast = data?.weather?.forecast ?? []

  return (
    <div className="h-full bg-surface-raised border border-gold/20 rounded-xl shadow-[0_0_12px_rgba(201,168,76,0.05)] flex flex-col overflow-hidden">
      <div className="px-5 pt-5 pb-0 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-widest text-gold font-medium">Weather</p>
        <p className="text-xs text-ink-muted">Milwaukee</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-5 py-4">
        {loading || !current ? (
          <div className="space-y-2">
            <div className="animate-pulse h-16 w-40 bg-surface-card rounded" />
            <div className="animate-pulse h-4 w-28 bg-surface-card rounded" />
            <div className="animate-pulse h-4 w-36 bg-surface-card rounded mt-1" />
          </div>
        ) : (
          <>
            <p className="text-[4.5rem] leading-none font-extrabold font-display text-ink tracking-tight">
              {current.temp}°
            </p>
            <div className="flex items-center gap-2 mt-2">
              <WeatherIcon condition={current.conditionLabel} size={18} />
              <p className="text-lg text-ink font-medium">{current.conditionLabel}</p>
            </div>
            <div className="flex gap-4 mt-1.5">
              <p className="text-sm text-ink-muted">Feels like {current.feelsLike}°</p>
              <p className="text-sm text-ink-muted">Humidity {current.humidity}%</p>
            </div>
          </>
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="border-t border-gold/10 pt-4">
          {loading || forecast.length === 0 ? (
            <div className="flex justify-between gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="animate-pulse w-full h-12 bg-surface-card/60 rounded-sm" />
                  <div className="animate-pulse w-4 h-2 bg-surface-card/60 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-between gap-1">
              {forecast.map((day: any) => (
                <div
                  key={day.date}
                  className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-0.5 rounded-md ${
                    isToday(day.date) ? 'border border-gold/30 bg-gold/5' : ''
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wide text-ink-muted font-medium">
                    {dayAbbr(day.date)}
                  </span>
                  <WeatherIcon condition={day.conditionLabel} size={14} />
                  <span className="text-[10px] text-ink font-semibold">{day.tempHigh}°</span>
                  <span className="text-[9px] text-ink-muted">{day.tempLow}°</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
