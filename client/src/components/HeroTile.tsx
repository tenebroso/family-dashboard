import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useTimeOfDay } from '../hooks/useTimeOfDay'
import { useActivePerson } from '../contexts/PersonContext'
import Skeleton from './Skeleton'

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

const CHORES_QUERY = gql`
  query HeroChores($dateKey: String!) {
    people {
      id
      name
      completionRate(dateKey: $dateKey)
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

interface Person {
  id: string
  name: string
  completionRate: number
}

const PERSON_COLORS: Record<string, string> = {
  jon:     'var(--p-jon)',
  krysten: 'var(--p-krysten)',
  harry:   'var(--p-harry)',
  ruby:    'var(--p-ruby)',
  mylo:    'var(--p-mylo)',
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
  const navigate = useNavigate()

  const start = today.startOf('day').toISOString()
  const end = today.endOf('day').toISOString()
  const dateKey = today.format('YYYY-MM-DD')

  const { data: eventsData } = useQuery<{ calendarEvents: CalendarEvent[] }>(TODAY_EVENTS_QUERY, { variables: { start, end } })
  const { data: choresData, loading: choresLoading } = useQuery<{ people: Person[] }>(CHORES_QUERY, { variables: { dateKey } })

  const allEvents: CalendarEvent[] = eventsData?.calendarEvents ?? []
  const events = activePerson
    ? allEvents.filter(e => e.personSlug === null || e.personSlug === activePerson)
    : allEvents

  const sorted = [...events].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1
    if (!a.allDay && b.allDay) return 1
    return dayjs(a.start).diff(dayjs(b.start))
  })

  const nextEvent = sorted.find(e => !e.allDay && dayjs(e.end).isAfter(now))

  const allPeople: Person[] = choresData?.people ?? []
  const people = activePerson
    ? allPeople.filter(p => p.name.toLowerCase() === activePerson)
    : allPeople

  const choresPath = activePerson ? `/${activePerson}/chores` : '/chores'

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
            Nothing on the calendar today.
          </div>
        </div>
      )}

      {/* Today's Chores */}
      <div className="timeline">
        <div className="timeline-head">
          <h3 className="timeline-head-title">Today's chores</h3>
          <button
            onClick={() => navigate(choresPath)}
            className="timeline-head-count"
            style={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            View all →
          </button>
        </div>

        {choresLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                <Skeleton className="h-2 flex-1 rounded-full" />
                <Skeleton className="w-8 h-3 rounded" />
              </div>
            ))}
          </div>
        ) : people.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 14, padding: '20px 0' }}>
            No chores assigned.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            {people.map(p => {
              const slug = p.name.toLowerCase()
              const pColor = PERSON_COLORS[slug] ?? 'var(--accent)'
              const pct = Math.round(p.completionRate * 100)
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(choresPath)}
                  className="flex items-center gap-2 w-full text-left"
                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: pColor }}
                  >
                    {p.name[0]}
                  </div>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hairline)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: pColor }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right tabular-nums" style={{ color: pColor }}>
                    {pct}%
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
