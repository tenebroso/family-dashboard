import { useState, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'
import { WeatherDayModal, WeatherIcon } from '../components/WeatherDayModal'
import type { WeatherDay } from '../components/WeatherDayModal'

dayjs.extend(isoWeek)

const CALENDAR_EVENTS_QUERY = gql`
  query CalendarEvents($start: String!, $end: String!) {
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

type View = 'month' | 'week' | 'day'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6am–10pm
const CELL_HEIGHT = 64 // px per hour in day view

function getDateRange(view: View, date: dayjs.Dayjs): { start: string; end: string } {
  if (view === 'month') {
    const monthStart = date.startOf('month')
    const gridStart = monthStart.subtract(monthStart.day(), 'day')
    const gridEnd = gridStart.add(41, 'day').endOf('day')
    return { start: gridStart.toISOString(), end: gridEnd.toISOString() }
  }
  if (view === 'week') {
    const weekStart = date.startOf('isoWeek')
    return { start: weekStart.toISOString(), end: weekStart.add(6, 'day').endOf('day').toISOString() }
  }
  return { start: date.startOf('day').toISOString(), end: date.endOf('day').toISOString() }
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

function formatTime(isoStr: string): string {
  return dayjs(isoStr).format('h:mm A')
}

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      data-testid="event-chip"
      className="w-full text-left text-xs truncate rounded px-1.5 py-0.5 mb-0.5 font-medium leading-5"
      style={{
        backgroundColor: event.color + '2e',
        borderLeft: `2px solid ${event.color}`,
        color: event.color,
      }}
    >
      {!event.allDay && (
        <span className="opacity-60">{dayjs(event.start).format('h:mma')} </span>
      )}
      {event.title}
    </button>
  )
}

function MonthView({
  currentDate,
  eventsByDate,
  onDayClick,
  onEventClick,
}: {
  currentDate: dayjs.Dayjs
  eventsByDate: Map<string, CalendarEvent[]>
  onDayClick: (date: dayjs.Dayjs, events: CalendarEvent[]) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const today = dayjs()
  const monthStart = currentDate.startOf('month')
  const gridStart = monthStart.subtract(monthStart.day(), 'day')
  const cells = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'))

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div
            key={d}
            className="text-center text-xs font-display font-bold uppercase tracking-widest text-ink-muted py-2"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border border-gold/10 rounded-xl overflow-hidden divide-x divide-y divide-gold/10">
        {cells.map(cell => {
          const dateKey = cell.format('YYYY-MM-DD')
          const dayEvents = eventsByDate.get(dateKey) ?? []
          const isCurrentMonth = cell.month() === currentDate.month()
          const isToday = cell.isSame(today, 'day')
          const visible = dayEvents.slice(0, 2)
          const overflow = dayEvents.length - visible.length

          return (
            <div
              key={dateKey}
              data-testid={isToday ? 'today-cell' : undefined}
              className={`bg-surface-card min-h-[80px] sm:min-h-[100px] p-1 sm:p-1.5 transition-colors ${
                dayEvents.length > 0 ? 'cursor-pointer hover:bg-surface-raised' : ''
              } ${!isCurrentMonth ? 'opacity-25' : ''}`}
              onClick={() => dayEvents.length > 0 && onDayClick(cell, dayEvents)}
            >
              <div className="flex justify-end mb-0.5">
                <span
                  className={`text-xs font-display font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-gold text-surface text-xs font-extrabold'
                      : 'text-ink-muted'
                  }`}
                >
                  {cell.date()}
                </span>
              </div>
              <div className="hidden sm:block">
                {visible.map(evt => (
                  <EventChip
                    key={evt.id}
                    event={evt}
                    onClick={e => { e.stopPropagation(); onEventClick(evt) }}
                  />
                ))}
                {overflow > 0 && (
                  <div className="text-xs text-ink-muted px-1">+{overflow} more</div>
                )}
              </div>
              {/* Mobile: just show a dot per event */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 flex-wrap sm:hidden px-0.5">
                  {dayEvents.slice(0, 3).map(evt => (
                    <div
                      key={evt.id}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: evt.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({
  currentDate,
  events,
  onEventClick,
  weatherByDate,
  onWeatherClick,
}: {
  currentDate: dayjs.Dayjs
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  weatherByDate?: Map<string, WeatherDay>
  onWeatherClick?: (day: WeatherDay) => void
}) {
  const today = dayjs()
  const weekStart = currentDate.startOf('isoWeek')
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
  const eventsByDate = useMemo(() => groupByDate(events), [events])

  return (
    <div data-testid="calendar-week-view" className="border border-gold/10 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-gold/10">
        {days.map(day => {
          const dateKey = day.format('YYYY-MM-DD')
          const dayEvents = eventsByDate.get(dateKey) ?? []
          const isToday = day.isSame(today, 'day')
          const weather = weatherByDate?.get(dateKey)

          return (
            <div key={dateKey} className={`bg-surface-card ${isToday ? 'bg-surface-raised' : ''}`}>
              {/* Day header — single row: name · number · temp */}
              <div className={`flex items-center gap-1 px-2 py-2.5 border-b ${isToday ? 'border-gold/30' : 'border-gold/10'}`}>
                <span className="text-xs text-ink-muted uppercase tracking-wide font-display leading-none shrink-0">
                  {day.format('ddd')}
                </span>
                <span
                  className={`text-sm font-display font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
                    isToday ? 'bg-gold text-surface' : 'text-ink'
                  }`}
                >
                  {day.date()}
                </span>
                {weather ? (
                  <button
                    onClick={() => onWeatherClick?.(weather)}
                    className="ml-auto flex items-center gap-0.5 hover:opacity-70 transition-opacity shrink-0"
                    title={`${weather.conditionLabel} · ${weather.precipitationProbability}% rain`}
                  >
                    <WeatherIcon condition={weather.conditionLabel} size={12} className="text-ink-muted" />
                    <span className="text-xs font-semibold text-ink-muted tabular-nums leading-none">
                      {weather.tempHigh}°
                    </span>
                  </button>
                ) : null}
              </div>

              <div className="p-1.5 space-y-1 min-h-[300px]">
                {dayEvents.map(evt => (
                  <button
                    key={evt.id}
                    data-testid="event-chip"
                    onClick={() => onEventClick(evt)}
                    className="w-full text-left rounded-lg p-2 text-xs transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: evt.color + '22',
                      borderLeft: `3px solid ${evt.color}`,
                    }}
                  >
                    <div className="font-semibold truncate" style={{ color: evt.color }}>
                      {evt.title}
                    </div>
                    {!evt.allDay && (
                      <div className="text-ink-muted mt-0.5">{formatTime(evt.start)}</div>
                    )}
                    {evt.allDay && (
                      <div className="text-ink-muted mt-0.5 italic">All day</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({
  currentDate,
  events,
  onEventClick,
}: {
  currentDate: dayjs.Dayjs
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}) {
  const allDayEvents = events.filter(e => e.allDay)
  const timedEvents = events.filter(e => !e.allDay)

  return (
    <div data-testid="calendar-day-view">
      {allDayEvents.length > 0 && (
        <div className="mb-4 p-3 bg-surface-card rounded-xl border border-gold/10">
          <div className="text-xs text-gold uppercase tracking-widest font-display font-bold mb-2">All Day</div>
          <div className="space-y-1">
            {allDayEvents.map(evt => (
              <EventChip key={evt.id} event={evt} onClick={() => onEventClick(evt)} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface-card rounded-xl border border-gold/10 overflow-hidden">
        <div className="relative">
          {HOURS.map(hour => (
            <div key={hour} className="flex items-start border-b border-gold/5" style={{ height: CELL_HEIGHT }}>
              <div className="w-14 shrink-0 text-xs text-ink-muted text-right pr-3 pt-1 font-display select-none">
                {hour === 12 ? '12pm' : hour < 12 ? `${hour}am` : `${hour - 12}pm`}
              </div>
              <div className="flex-1 border-l border-gold/10 h-full" />
            </div>
          ))}

          {/* Positioned timed events */}
          <div className="absolute inset-0 left-14 pointer-events-none">
            {timedEvents.map(evt => {
              const startDj = dayjs(evt.start)
              const endDj = dayjs(evt.end)
              const startHour = startDj.hour() + startDj.minute() / 60
              const endHour = endDj.hour() + endDj.minute() / 60
              const clampedStart = Math.max(startHour, 6)
              const clampedEnd = Math.min(endHour, 23)
              const top = (clampedStart - 6) * CELL_HEIGHT
              const height = Math.max((clampedEnd - clampedStart) * CELL_HEIGHT, 24)

              return (
                <button
                  key={evt.id}
                  data-testid="event-chip"
                  onClick={() => onEventClick(evt)}
                  className="absolute left-1 right-2 rounded-lg text-xs p-2 text-left pointer-events-auto overflow-hidden"
                  style={{
                    top,
                    height,
                    backgroundColor: evt.color + '33',
                    borderLeft: `3px solid ${evt.color}`,
                    color: evt.color,
                  }}
                >
                  <div className="font-semibold truncate">{evt.title}</div>
                  {height >= 40 && (
                    <div className="opacity-70 text-xs mt-0.5">
                      {formatTime(evt.start)} – {formatTime(evt.end)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function EventDetailModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        data-testid="event-detail"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-surface-card rounded-t-2xl md:rounded-2xl border border-gold/20 p-6"
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-1 h-12 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: event.color }}
          />
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

function DayEventsPanel({
  date,
  events,
  onClose,
  onEventClick,
}: {
  date: dayjs.Dayjs
  events: CalendarEvent[]
  onClose: () => void
  onEventClick: (evt: CalendarEvent) => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        data-testid="event-detail"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-surface-card rounded-t-2xl md:rounded-2xl border border-gold/20 p-6 max-h-[70vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-gold uppercase tracking-widest font-display font-bold mb-1">
              {date.format('dddd')}
            </div>
            <h2 className="font-display font-bold text-2xl text-ink">{date.format('MMMM D, YYYY')}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface text-ink-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {events.map(evt => (
            <button
              key={evt.id}
              onClick={() => onEventClick(evt)}
              className="w-full text-left rounded-xl p-4 flex items-start gap-3 hover:bg-surface transition-colors border border-transparent hover:border-gold/10"
              style={{ borderLeftColor: evt.color, borderLeftWidth: 4 }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink truncate">{evt.title}</div>
                {!evt.allDay ? (
                  <div className="text-sm text-ink-muted mt-0.5 flex items-center gap-1.5">
                    <Clock size={12} />
                    {formatTime(evt.start)} – {formatTime(evt.end)}
                  </div>
                ) : (
                  <div className="text-sm text-ink-muted mt-0.5 italic">All day</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  )
}

export default function CalendarPage() {
  const [view, setView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDayData, setSelectedDayData] = useState<{ date: dayjs.Dayjs; events: CalendarEvent[] } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedWeatherDay, setSelectedWeatherDay] = useState<WeatherDay | null>(null)

  const { start, end } = useMemo(() => getDateRange(view, currentDate), [view, currentDate])

  const { data, loading } = useQuery(CALENDAR_EVENTS_QUERY, { variables: { start, end } })
  const events: CalendarEvent[] = data?.calendarEvents ?? []
  const eventsByDate = useMemo(() => groupByDate(events), [events])

  const weatherByDate = useMemo(() => {
    const map = new Map<string, WeatherDay>()
    const forecast: WeatherDay[] = data?.weather?.forecast ?? []
    forecast.forEach(d => map.set(d.date, d))
    return map
  }, [data])

  const navigate = (dir: 1 | -1) => {
    setCurrentDate(d => {
      if (view === 'month') return d.add(dir, 'month')
      if (view === 'week') return d.add(dir * 7, 'day')
      return d.add(dir, 'day')
    })
  }

  const periodLabel = useMemo(() => {
    if (view === 'month') return currentDate.format('MMMM YYYY')
    if (view === 'week') {
      const ws = currentDate.startOf('isoWeek')
      const we = ws.add(6, 'day')
      if (ws.month() === we.month()) return `${ws.format('MMMM D')} – ${we.format('D, YYYY')}`
      return `${ws.format('MMM D')} – ${we.format('MMM D, YYYY')}`
    }
    return currentDate.format('dddd, MMMM D, YYYY')
  }, [view, currentDate])

  const closeDetail = () => {
    setSelectedDayData(null)
    setSelectedEvent(null)
  }

  const handleEventClick = (evt: CalendarEvent) => {
    setSelectedDayData(null)
    setSelectedEvent(evt)
  }

  return (
    <div className="min-h-screen bg-surface px-4 pb-10 pt-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-2">
          <a href="/" className="text-xs text-ink-muted hover:text-ink transition-colors">← Home</a>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-raised text-ink-muted transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-display font-bold text-xl text-ink min-w-[180px] text-center tabular-nums">
              {periodLabel}
            </h1>
            <button
              onClick={() => navigate(1)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-raised text-ink-muted transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div
            className="flex rounded-lg border border-gold/20 overflow-hidden"
            role="group"
            aria-label="Calendar view"
          >
            {(['month', 'week', 'day'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium font-display capitalize transition-colors ${
                  view === v
                    ? 'bg-gold text-surface'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="h-0.5 bg-surface-raised rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gold/50 rounded-full w-1/3 animate-pulse" />
          </div>
        )}

        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onDayClick={(date, dayEvents) => setSelectedDayData({ date, events: dayEvents })}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            weatherByDate={weatherByDate}
            onWeatherClick={setSelectedWeatherDay}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedDayData && !selectedEvent && !selectedWeatherDay && (
          <DayEventsPanel
            key="day-panel"
            date={selectedDayData.date}
            events={selectedDayData.events}
            onClose={closeDetail}
            onEventClick={handleEventClick}
          />
        )}
        {selectedEvent && !selectedWeatherDay && (
          <EventDetailModal
            key="event-modal"
            event={selectedEvent}
            onClose={closeDetail}
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
