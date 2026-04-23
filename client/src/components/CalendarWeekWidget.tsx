import { useState, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { AnimatePresence, motion } from 'framer-motion'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { WeatherDayModal, WeatherIcon } from './WeatherDayModal'
import type { WeatherDay } from './WeatherDayModal'
import { useActivePerson } from '../contexts/PersonContext'

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
      personSlug
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
  personSlug: string | null
}

function formatTime(isoStr: string): string {
  return dayjs(isoStr).format('h:mm A')
}

function personColor(slug: string | null | undefined, fallback: string): string {
  if (slug) return `var(--p-${slug})`
  return fallback
}

function personBg(slug: string | null | undefined, fallback: string): string {
  if (slug) return `color-mix(in oklch, var(--p-${slug}) 10%, transparent)`
  return fallback
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
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] rounded-t-2xl md:rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-1 h-12 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: personColor(event.personSlug, event.color) }} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-xl leading-tight" style={{ color: 'var(--ink)' }}>{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors shrink-0"
            style={{ background: 'var(--surface-sunk)', color: 'var(--ink-3)' }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 pl-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-3)' }}>
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
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)' }}>{event.description}</p>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default function CalendarWeekWidget() {
  const [currentDate, setCurrentDate] = useState(() =>
    dayjs().day() === 0 ? dayjs().add(1, 'week') : dayjs()
  )
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedWeatherDay, setSelectedWeatherDay] = useState<WeatherDay | null>(null)
  const navigate = useNavigate()
  const { activePerson } = useActivePerson()

  const weekStart = currentDate.startOf('isoWeek')
  const weekEnd = weekStart.add(6, 'day').endOf('day')
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))

  const { start, end } = useMemo(
    () => ({ start: weekStart.toISOString(), end: weekEnd.toISOString() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart.format('YYYY-MM-DD')]
  )

  const { data, loading } = useQuery<{ calendarEvents: CalendarEvent[]; weather: { forecast: WeatherDay[] } }>(WEEK_QUERY, { variables: { start, end }, pollInterval: 60_000 })
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
    if (weekStart.month() === we.month()) return `${weekStart.format('MMM D')} – ${we.format('D')}`
    return `${weekStart.format('MMM D')} – ${we.format('MMM D')}`
  }, [weekStart])

  return (
    <div className="tile calendar-tile">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--hairline)' }}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentDate(d => d.subtract(7, 'day'))}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--ink-3)' }}
            aria-label="Previous week"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="font-display font-bold text-sm min-w-[140px] text-center tabular-nums" style={{ color: 'var(--ink)' }}>
            {periodLabel}
          </span>
          <button
            onClick={() => setCurrentDate(d => d.add(7, 'day'))}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--ink-3)' }}
            aria-label="Next week"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {loading && (
            <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--hairline)', borderTopColor: 'var(--accent)' }} />
          )}
          <button
            onClick={() => navigate(activePerson ? `/${activePerson}/calendar` : '/calendar')}
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--accent-ink)' }}
          >
            Full view →
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--hairline-soft)', minHeight: 200 }}>
        {days.map(day => {
          const dateKey = day.format('YYYY-MM-DD')
          const dayEvents = eventsByDate.get(dateKey) ?? []
          const weather = weatherByDate.get(dateKey)
          const isToday = day.isSame(today, 'day')

          return (
            <div
              key={dateKey}
              className="flex flex-col"
              style={{
                borderRight: '1px solid var(--hairline-soft)',
                background: isToday ? 'var(--accent-wash)' : undefined,
              }}
            >
              {/* Day header */}
              <div
                className="flex items-center gap-1.5 px-2 py-2 flex-shrink-0"
                style={{ borderBottom: `1px solid ${isToday ? 'var(--accent-wash-2)' : 'var(--hairline-soft)'}` }}
              >
                <span className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: 'var(--ink-3)' }}>
                  <span className="hidden sm:inline">{day.format('ddd')}</span>
                  <span className="sm:hidden">{day.format('dd')[0]}</span>
                </span>
                {isToday ? (
                  <span className="week-day-num-today">{day.date()}</span>
                ) : (
                  <span className="week-day-num">{day.date()}</span>
                )}
                {weather ? (
                  <button
                    onClick={() => setSelectedWeatherDay(weather)}
                    className="ml-auto flex items-center gap-0.5 hover:opacity-70 transition-opacity"
                  >
                    <WeatherIcon condition={weather.conditionLabel} size={10} className="text-ink-muted" />
                    <span className="text-[9px] font-semibold tabular-nums" style={{ color: 'var(--ink-3)' }}>
                      {weather.tempHigh}°
                    </span>
                  </button>
                ) : null}
              </div>

              {/* Events */}
              <div className="p-2 space-y-2 overflow-hidden">
                {dayEvents.map(evt => {
                  const dimmed = activePerson !== null && evt.personSlug !== null && evt.personSlug !== activePerson
                  return (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="w-full text-left rounded-md p-1 text-xs transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: personBg(evt.personSlug, evt.color + '18'),
                      borderLeft: `2px solid ${personColor(evt.personSlug, evt.color)}`,
                      opacity: dimmed ? 0.3 : 1,
                    }}
                  >
                    <div className="font-semibold truncate leading-tight" style={{ color: personColor(evt.personSlug, evt.color) }}>
                      <span className="hidden sm:inline">{evt.title}</span>
                      <span className="sm:hidden">{evt.title[0]}</span>
                    </div>
                    {!evt.allDay && (
                      <div className="hidden sm:block mt-0.5" style={{ color: 'var(--ink-3)', fontSize: '10px' }}>
                        {formatTime(evt.start)}
                      </div>
                    )}
                  </button>
                  )
                })}
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
