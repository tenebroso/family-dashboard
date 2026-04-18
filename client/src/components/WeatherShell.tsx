import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const WEATHER_QUERY = gql`
  query WeatherShell {
    weather {
      current {
        temp
        conditionLabel
        feelsLike
        humidity
      }
    }
  }
`

const FORECAST_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeatherShell() {
  const { data, loading } = useQuery(WEATHER_QUERY)
  const current = data?.weather?.current

  return (
    <div className="h-full bg-surface-raised border border-gold/20 rounded-xl shadow-[0_0_12px_rgba(201,168,76,0.05)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-0 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-widest text-gold font-medium">Weather</p>
        <p className="text-xs text-ink-muted">Milwaukee</p>
      </div>

      {/* Main temp — vertically centered in flex-1 */}
      <div className="flex-1 flex flex-col justify-center px-5 py-4">
        {loading ? (
          <div className="space-y-2">
            <div className="animate-pulse h-16 w-40 bg-surface-card rounded" />
            <div className="animate-pulse h-4 w-28 bg-surface-card rounded" />
          </div>
        ) : (
          <>
            <p className="text-[4.5rem] leading-none font-extrabold font-display text-ink tracking-tight">
              {current?.temp}°
            </p>
            <p className="text-lg text-ink mt-2 font-medium">{current?.conditionLabel}</p>
            <div className="flex gap-4 mt-1.5">
              <p className="text-sm text-ink-muted">Feels like {current?.feelsLike}°F</p>
              <p className="text-sm text-ink-muted">Humidity {current?.humidity}%</p>
            </div>
          </>
        )}
      </div>

      {/* Forecast placeholder strip */}
      <div className="px-5 pb-5">
        <div className="border-t border-gold/10 pt-4">
          <div className="flex justify-between items-end gap-1">
            {FORECAST_DAYS.map((day) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full h-6 bg-surface-card/60 rounded-sm" />
                <span className="text-[9px] uppercase tracking-wide text-ink-muted/40">{day}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-ink-muted/30 mt-2 text-right tracking-wider uppercase">7-day forecast</p>
        </div>
      </div>
    </div>
  )
}
