import { useMemo } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { CalendarDays } from 'lucide-react'
import { useActivePerson } from '../contexts/PersonContext'

const TODAY_QUERY = gql`
  query TodayAgenda($start: String!, $end: String!) {
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

export default function TodayAgendaWidget() {
  const { activePerson } = useActivePerson()
  const navigate = useNavigate()

  const today = dayjs()
  const start = useMemo(() => today.startOf('day').toISOString(), [today.format('YYYY-MM-DD')])
  const end = useMemo(() => today.endOf('day').toISOString(), [today.format('YYYY-MM-DD')])

  const { data, loading } = useQuery<{ calendarEvents: CalendarEvent[] }>(TODAY_QUERY, { variables: { start, end }, pollInterval: 60_000 })

  const events: CalendarEvent[] = useMemo(() => {
    const all: CalendarEvent[] = data?.calendarEvents ?? []
    const filtered = all.filter(evt =>
      evt.personSlug === null || !activePerson || evt.personSlug === activePerson
    )
    // All-day events first, then sorted by start time
    return [
      ...filtered.filter(e => e.allDay),
      ...filtered.filter(e => !e.allDay).sort((a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
      ),
    ]
  }, [data, activePerson])

  const personLabel = activePerson
    ? activePerson.charAt(0).toUpperCase() + activePerson.slice(1) + "'s "
    : ''

  return (
    <div className="tile agenda-tile">
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--hairline)' }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={14} style={{ color: 'var(--ink-3)' }} />
          <span className="font-display font-bold text-sm" style={{ color: 'var(--ink)' }}>
            {personLabel}Today · {today.format('MMM D')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--hairline)', borderTopColor: 'var(--accent)' }} />
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

      <div className="agenda-list">
        {!loading && events.length === 0 ? (
          <div className="agenda-empty">
            {activePerson ? `Nothing on ${personLabel.replace("'s ", "'s")} schedule today` : 'Nothing scheduled today'}
          </div>
        ) : (
          events.map(evt => (
            <div
              key={evt.id}
              className="agenda-event"
              style={{
                borderLeft: `3px solid ${evt.personSlug ? `var(--p-${evt.personSlug})` : evt.color}`,
                background: evt.personSlug
                  ? `color-mix(in oklch, var(--p-${evt.personSlug}) 8%, transparent)`
                  : `${evt.color}10`,
              }}
            >
              <div
                className="agenda-event-title"
                style={{ color: evt.personSlug ? `var(--p-${evt.personSlug})` : evt.color }}
              >
                {evt.title}
              </div>
              <div className="agenda-event-time">
                {evt.allDay ? 'All day' : `${formatTime(evt.start)} – ${formatTime(evt.end)}`}
                {evt.personSlug === null && <span className="agenda-family-badge">Family</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
