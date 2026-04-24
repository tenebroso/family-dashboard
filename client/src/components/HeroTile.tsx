import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { motion } from 'framer-motion'
import { useTimeOfDay } from '../hooks/useTimeOfDay'
import { useActivePerson } from '../contexts/PersonContext'
import Skeleton from './Skeleton'

dayjs.extend(isoWeek)

const DATE_KEY = dayjs().format('YYYY-MM-DD')
const DAY_OF_WEEK = dayjs().day()

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

const HERO_CHORES_QUERY = gql`
  query HeroChores($dayOfWeek: Int, $dateKey: String!) {
    people {
      id
      name
      chores(dayOfWeek: $dayOfWeek, dateKey: $dateKey) {
        id
        title
        isCompletedOn(dateKey: $dateKey)
      }
    }
  }
`

const COMPLETE_CHORE = gql`
  mutation HeroCompleteChore($choreId: ID!, $dateKey: String!) {
    completeChore(choreId: $choreId, dateKey: $dateKey) {
      id
      choreId
      dateKey
    }
  }
`

const UNCOMPLETE_CHORE = gql`
  mutation HeroUncompleteChore($choreId: ID!, $dateKey: String!) {
    uncompleteChore(choreId: $choreId, dateKey: $dateKey)
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

interface Chore {
  id: string
  title: string
  isCompletedOn: boolean
}

interface Person {
  id: string
  name: string
  chores: Chore[]
}

const PERSON_COLORS: Record<string, string> = {
  jon:     'var(--p-jon)',
  krysten: 'var(--p-krysten)',
  harry:   'var(--p-harry)',
  ruby:    'var(--p-ruby)',
  mylo:    'var(--p-mylo)',
}

const PERSON_NAMES: Record<string, string> = {
  jon: 'Jon', krysten: 'Krysten', harry: 'Harry', ruby: 'Ruby', mylo: 'Mylo',
}

const GREETINGS = {
  morning:   'Good morning',
  afternoon: 'Good afternoon',
  evening:   'Good evening',
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

export default function HeroTile() {
  const tod = useTimeOfDay()
  const now = useLiveNow()
  const today = now
  const { activePerson } = useActivePerson()

  const start = today.startOf('day').toISOString()
  const end = today.endOf('day').toISOString()

  const { data: eventsData } = useQuery<{ calendarEvents: CalendarEvent[] }>(
    TODAY_EVENTS_QUERY, { variables: { start, end }, pollInterval: 15 * 60 * 1000 }
  )
  const { data: choresData, loading: choresLoading } = useQuery<{ people: Person[] }>(
    HERO_CHORES_QUERY, { variables: { dayOfWeek: DAY_OF_WEEK, dateKey: DATE_KEY } }
  )

  const [completeChore] = useMutation(COMPLETE_CHORE)
  const [uncompleteChore] = useMutation(UNCOMPLETE_CHORE)
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!choresData) return
    const ids = new Set<string>()
    for (const person of choresData.people) {
      for (const chore of person.chores) {
        if (chore.isCompletedOn) ids.add(chore.id)
      }
    }
    setCompleted(ids)
  }, [choresData])

  function handleToggle(choreId: string, isDone: boolean) {
    if (isDone) {
      setCompleted(prev => { const next = new Set(prev); next.delete(choreId); return next })
      uncompleteChore({ variables: { choreId, dateKey: DATE_KEY } }).catch(() => {
        setCompleted(prev => { const next = new Set(prev); next.add(choreId); return next })
      })
    } else {
      setCompleted(prev => new Set([...prev, choreId]))
      completeChore({ variables: { choreId, dateKey: DATE_KEY } }).catch(() => {
        setCompleted(prev => { const next = new Set(prev); next.delete(choreId); return next })
      })
    }
  }

  // Calendar events
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

  // Chores — filter to active person
  const allPeople: Person[] = choresData?.people ?? []
  const person = activePerson
    ? allPeople.find(p => p.name.toLowerCase() === activePerson) ?? null
    : null
  const chores = person?.chores ?? []
  const doneCount = chores.filter(c => completed.has(c.id)).length
  const total = chores.length
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const pColor = activePerson ? (PERSON_COLORS[activePerson] ?? 'var(--accent)') : 'var(--accent)'

  return (
    <div className="tile hero-tile">
      {/* Header */}
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
            WEEK {today.isoWeek()}
          </div>
        </div>
      </div>

      {/* Up next */}
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
          {total > 0 && (
            <span className="timeline-head-count">{doneCount} / {total} done</span>
          )}
        </div>

        {!activePerson ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 14, padding: '16px 0' }}>
            Select a person to see their chores.
          </div>
        ) : choresLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Skeleton className="w-6 h-6 rounded-md flex-shrink-0" />
                <Skeleton className="h-3 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : chores.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 14, padding: '16px 0' }}>
            No chores today — enjoy the day!
          </div>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 12px' }}>
              {chores.map(chore => {
                const isDone = completed.has(chore.id)
                return (
                  <li key={chore.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <button
                      onClick={() => handleToggle(chore.id, isDone)}
                      className="w-full flex items-center gap-3 text-left"
                      style={{ padding: '10px 0', minHeight: 44, background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label={`${chore.title} – ${isDone ? 'completed' : 'not completed'}`}
                    >
                      <motion.div
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          border: `2px solid ${isDone ? pColor : 'rgba(154,148,136,0.4)'}`,
                          backgroundColor: isDone ? pColor : 'transparent',
                        }}
                        animate={{ scale: isDone ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isDone && (
                          <motion.svg
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.15 }}
                            width="10" height="10" viewBox="0 0 12 12" fill="none"
                          >
                            <path d="M2 6l3 3 5-5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </motion.svg>
                        )}
                      </motion.div>
                      <span
                        className="text-sm transition-all duration-200"
                        style={{
                          color: isDone ? 'var(--ink-3)' : 'var(--ink)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {chore.title}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Progress bar */}
            <div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hairline)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: pColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
                <span style={{ fontSize: 11, color: pColor, fontWeight: 600 }}>{pct}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
