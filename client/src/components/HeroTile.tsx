import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useTimeOfDay } from '../hooks/useTimeOfDay'
import { useActivePerson } from '../contexts/PersonContext'

dayjs.extend(isoWeek)

const TODAY_EVENTS_QUERY = gql`
  query HeroTileEvents($start: String!, $end: String!) {
    calendarEvents(start: $start, end: $end) {
      id
      title
      start
      end
      allDay
      color
      personSlug
    }
  }
`

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  color: string
  personSlug: string | null
}

function useLiveNow() {
  const [now, setNow] = useState(dayjs())
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function relativeNext(start: dayjs.Dayjs, now: dayjs.Dayjs): string {
  const diff = start.diff(now, 'minute')
  if (diff <= 0) return 'now'
  if (diff < 60) return `in ${diff} min`
  return `in ${Math.round(diff / 60)}h`
}

const PERSON_NAMES: Record<string, string> = {
  jon: 'Jon', krysten: 'Krysten', harry: 'Harry', ruby: 'Ruby', mylo: 'Mylo',
}

const GREETINGS = {
  morning:   'Good morning',
  afternoon: 'Good afternoon',
  evening:   'Good evening',
}

export default function HeroTile() {
  const tod = useTimeOfDay()
  const now = useLiveNow()
  const today = now
  const { activePerson } = useActivePerson()

  const start = today.startOf('day').toISOString()
  const end = today.endOf('day').toISOString()

  const { data } = useQuery(TODAY_EVENTS_QUERY, { variables: { start, end } })
  const allEvents: CalendarEvent[] = data?.calendarEvents ?? []

  // When a person is selected, show only their events + family (null personSlug) events
  const events = activePerson
    ? allEvents.filter(e => e.personSlug === null || e.personSlug === activePerson)
    : allEvents

  const sorted = [...events].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1
    if (!a.allDay && b.allDay) return 1
    return dayjs(a.start).diff(dayjs(b.start))
  })

  const nextEvent = sorted.find(e => !e.allDay && dayjs(e.end).isAfter(now))

  return (
    <div className="tile hero-tile">
      {/* Header — date left, clock right */}
      <div className="hero-head">
        <div>
          <div className="hero-greet">
            {GREETINGS[tod]}, {activePerson ? (PERSON_NAMES[activePerson] ?? activePerson) : 'family'}
          </div>
          <h1 className="hero-date">
            {today.format('dddd')}, <em>{today.format('MMMM D')}</em>
          </h1>
        </div>
        <div className="hero-clock-block">
          {now.format('h:mm A')}
          <div className="hero-clock-tz">
            {today.format('dddd').toUpperCase()} · WEEK {today.isoWeek()}
          </div>
        </div>
      </div>

      {/* Up next card */}
      {nextEvent ? (
        <div className="hero-next">
          <div>
            <div className="hero-next-badge">Up next</div>
            <div className="hero-next-time">
              {dayjs(nextEvent.start).format('h:mm A')}
              <span className="hero-next-mins">{relativeNext(dayjs(nextEvent.start), now)}</span>
            </div>
          </div>
          <div className="hero-next-sep" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="hero-next-title">{nextEvent.title}</div>
            {nextEvent.personSlug && (
              <div className="hero-next-who" style={{ color: `var(--p-${nextEvent.personSlug})` }}>
                {PERSON_NAMES[nextEvent.personSlug] ?? nextEvent.personSlug}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hero-next">
          <div className="hero-next-badge">All clear</div>
          <div className="hero-next-title" style={{ marginLeft: 16 }}>
            Nothing else on the calendar today.
          </div>
        </div>
      )}

      {/* Today's agenda timeline */}
      <div className="timeline">
        <div className="timeline-head">
          <h3 className="timeline-head-title">Today's agenda</h3>
          <span className="timeline-head-count">
            {sorted.length} {sorted.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {sorted.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 14, padding: '20px 0' }}>
            Nothing scheduled today.
          </div>
        ) : (
          sorted.map(evt => {
            const isPast = !evt.allDay && dayjs(evt.end).isBefore(now)
            const isNow = !evt.allDay && evt === nextEvent && dayjs(evt.start).diff(now, 'minute') < 60

            return (
              <div
                key={evt.id}
                className={`t-row${isPast ? ' t-past' : ''}${isNow ? ' t-now' : ''}`}
                style={{ '--event-color': evt.color } as React.CSSProperties}
              >
                <div className="t-time">
                  {evt.allDay ? 'All day' : dayjs(evt.start).format('h:mma')}
                </div>
                <div className="t-body">
                  <span className="t-dot" />
                  <span className="t-title">{evt.title}</span>
                  {evt.personSlug && (
                    <span className="t-who">{PERSON_NAMES[evt.personSlug] ?? evt.personSlug}</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
