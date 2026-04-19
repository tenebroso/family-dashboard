import { motion } from 'framer-motion'
import { X, Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, Droplets, Thermometer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import dayjs from 'dayjs'

export interface WeatherDay {
  date: string
  tempHigh: number
  tempLow: number
  conditionCode: number
  conditionLabel: string
  precipitation: number
  precipitationProbability: number
}

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

export function WeatherIcon({ condition, size = 16, className = 'text-ink-muted' }: { condition: string; size?: number; className?: string }) {
  const Icon = CONDITION_ICONS[condition] ?? Cloud
  return <Icon size={size} className={className} />
}

export function WeatherDayModal({ day, onClose }: { day: WeatherDay; onClose: () => void }) {
  const date = dayjs(day.date + 'T12:00:00')

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[360px] bg-surface-card rounded-t-2xl md:rounded-2xl border border-gold/20 p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-xs text-gold uppercase tracking-widest font-display font-bold mb-1">
              {date.format('dddd')}
            </div>
            <h2 className="font-display font-bold text-xl text-ink">{date.format('MMMM D, YYYY')}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface text-ink-muted shrink-0 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Condition */}
        <div className="flex items-center gap-3 mb-5">
          <WeatherIcon condition={day.conditionLabel} size={36} className="text-gold/70" />
          <span className="text-2xl font-display font-semibold text-ink">{day.conditionLabel}</span>
        </div>

        {/* Temp high / low */}
        <div className="flex items-center gap-2 mb-3">
          <Thermometer size={16} className="text-ink-muted shrink-0" />
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-ink">{day.tempHigh}°</span>
            <span className="text-ink-muted font-display">/ {day.tempLow}°</span>
            <span className="text-xs text-ink-muted">High / Low</span>
          </div>
        </div>

        {/* Precipitation */}
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-ink-muted shrink-0" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-ink font-medium">{day.precipitationProbability}% chance of rain</span>
            {day.precipitation > 0 && (
              <span className="text-xs text-ink-muted">· {day.precipitation} mm</span>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
