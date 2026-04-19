import { useState, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { AnimatePresence, motion } from 'framer-motion'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAerial } from '../contexts/AerialContext'
import { WeatherDayModal, WeatherIcon } from './WeatherDayModal'
import type { WeatherDay } from './WeatherDayModal'

dayjs.extend(isoWeek)

const WEEK_QUERY = gql`
  query CalendarWeekWidget($start: String!, $end: String!) {
    calendarEvents(start: $start, end: $end) {
      id
      title
      start
      end
      allDay
      description
      color
    }
    weather {
      forecast {
        date
        tempHigh
        tempLow
        conditionCode
        conditionLabel
        precipitation
        precipitationProbability
      }
    }
  }
`

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  description: string | null
  color: string
}

function formatTime(isoStr: string): string {
  return dayjs(isoStr).format('h:mm A')
}

function groupByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  events.forEach(evt => {
    const key = evt.allDay ? evt.start.slice(0, 10) : dayjs(evt.start).format('YYYY-MM-DD')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(evt)
  })
  return map
}

function EventDetailModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-surface-card rounded-t-2xl md:rounded-2xl border border-gold/20 p-6"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-1 h-12 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: event.color }} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-xl text-ink leading-tight">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface text-ink-muted shrink-0 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 pl-4">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Clock size={14} className="shrink-0" />
            {event.allDay ? (
              <span>All day · {dayjs(event.start).format('MMMM D, YYYY')}</span>
            ) : (
              <span>
                {dayjs(event.start).format('MMMM D, YYYY')} · {formatTime(event.start)} – {formatTime(event.end)}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-ink-muted leading-relaxed">{event.description}</p>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default function CalendarWeekWidget() {
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedWeatherDay, setSelectedWeatherDay] = useState<WeatherDay | null>(null)
  const navigate = useNavigate()
  const aerial = useAerial()

  const cardClass = aerial
    ? 'backdrop-blur-md bg-black/50 rounded-xl ring-1 ring-white/10'
    : 'bg-surface-raised rounded-xl'

  const weekStart = currentDate.startOf('isoWeek')
  const weekEnd = weekStart.add(6, 'day').endOf('day')
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))

  const { start, end } = useMemo(
    () => ({ start: weekStart.toISOString(), end: weekEnd.toISOString() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart.format('YYYY-MM-DD')]
  )

  const { data, loading } = useQuery(WEEK_QUERY, { variables: { start, end } })
  const events: CalendarEvent[] = data?.calendarEvents ?? []
  const eventsByDate = useMemo(() => groupByDate(events), [events])

  const weatherByDate = useMemo(() => {
    const map = new Map<string, WeatherDay>()
    const forecast: WeatherDay[] = data?.weather?.forecast ?? []
    forecast.forEach(d => map.set(d.date, d))
    return map
  }, [data])

  const today = dayjs()
  const periodLabel = useMemo(() => {
    const we = weekStart.add(6, 'day')
    if (weekStart.month() === we.month()) return `${weekStart.format('MMMM D')} – ${we.format('D, YYYY')}`
    return `${weekStart.format('MMM D')} – ${we.format('MMM D, YYYY')}`
  }, [weekStart])

  return (
    <div className={cardClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(d => d.subtract(7, 'day'))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-ink-muted transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-display font-bold text-sm text-ink min-w-[160px] text-center tabular-nums">
            {periodLabel}
          </span>
          <button
            onClick={() => setCurrentDate(d => d.add(7, 'day'))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-ink-muted transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          )}
          <button
            onClick={() => navigate('/calendar')}
            className="text-xs text-gold/60 hover:text-gold transition-colors font-display tracking-wide"
          >
            Full calendar →
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 divide-x divide-gold/10">
        {days.map(day => {
          const dateKey = day.format('YYYY-MM-DD')
          const dayEvents = eventsByDate.get(dateKey) ?? []
          const weather = weatherByDate.get(dateKey)
          const isToday = day.isSame(today, 'day')

          return (
            <div key={dateKey} className={isToday ? 'bg-white/5' : ''}>
              {/* Day header — single row: name · number · temp */}
              <div className={`flex items-center gap-1 px-1.5 py-2 border-b ${isToday ? 'border-gold/30' : 'border-gold/10'}`}>
                <span className="text-[10px] text-ink-muted uppercase tracking-wide font-display leading-none shrink-0">
                  <span className="hidden sm:inline">{day.format('ddd')}</span>
                  <span className="sm:hidden">{day.format('dd')[0]}</span>
                </span>
                <span
                  className={`text-xs font-display font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${
                    isToday ? 'bg-gold text-surface' : 'text-ink'
                  }`}
                >
                  {day.date()}
                </span>
                {weather ? (
                  <button
                    onClick={() => setSelectedWeatherDay(weather)}
                    className="ml-auto flex items-center gap-0.5 hover:opacity-70 transition-opacity shrink-0"
                    title={`${weather.conditionLabel} · ${weather.precipitationProbability}% rain`}
                  >
                    <WeatherIcon condition={weather.conditionLabel} size={11} className="text-ink-muted" />
                    <span className="text-[10px] font-semibold text-ink-muted tabular-nums leading-none">
                      {weather.tempHigh}°
                    </span>
                  </button>
                ) : null}
              </div>

              {/* Events */}
              <div className="p-1 space-y-1 min-h-[120px] md:min-h-[140px]">
                {dayEvents.map(evt => (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="w-full text-left rounded-md p-1.5 text-xs transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: evt.color + '22',
                      borderLeft: `2px solid ${evt.color}`,
                    }}
                  >
                    <div className="font-semibold truncate leading-tight" style={{ color: evt.color }}>
                      <span className="hidden sm:inline">{evt.title}</span>
                      <span className="sm:hidden">{evt.title[0]}</span>
                    </div>
                    {!evt.allDay && (
                      <div className="text-ink-muted mt-0.5 hidden sm:block">{formatTime(evt.start)}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {selectedEvent && !selectedWeatherDay && (
          <EventDetailModal
            key="event-modal"
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
        {selectedWeatherDay && (
          <WeatherDayModal
            key="weather-modal"
            day={selectedWeatherDay}
            onClose={() => setSelectedWeatherDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
