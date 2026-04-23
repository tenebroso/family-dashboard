import { useMemo } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import Skeleton from './Skeleton'
import { useAerial } from '../contexts/AerialContext'

const CALENDAR_QUERY = gql`
  query CalendarShell($start: String!, $end: String!) {
    calendarEvents(start: $start, end: $end) {
      id
      title
      start
      allDay
    }
  }
`

function formatEventDate(isoString: string): string {
  // Date-only strings ("YYYY-MM-DD") are parsed as UTC midnight by the Date
  // constructor, which shifts them to the previous calendar day in US timezones.
  // Parse them as local time directly to avoid the off-by-one.
  let d: Date
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    const [y, m, day] = isoString.split('-').map(Number)
    d = new Date(y, m - 1, day)
  } else {
    d = new Date(isoString)
  }
  const today = new Date()
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = Math.round((dMidnight.getTime() - todayMidnight.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CalendarShell() {
  const navigate = useNavigate()
  const aerial = useAerial()
  const cardClass = aerial
    ? 'backdrop-blur-md bg-black/50 rounded-lg ring-1 ring-white/10'
    : 'bg-surface-raised rounded-lg'

  const { start, end } = useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + 14)
    return { start: now.toISOString(), end: end.toISOString() }
  }, [])

  const { data, loading } = useQuery<{ calendarEvents: Array<{ id: string; title: string; start: string; allDay: boolean }> }>(CALENDAR_QUERY, { variables: { start, end } })

  const events: Array<{ id: string; title: string; start: string; allDay: boolean }> =
    data?.calendarEvents?.slice(0, 5) ?? []

  return (
    <button
      onClick={() => navigate('/calendar')}
      className={`w-full text-left flex flex-col cursor-pointer transition-opacity hover:opacity-90 ${cardClass}`}
    >
      <div className="px-4 pt-4 pb-3 flex items-baseline justify-between border-b border-white/5">
        <p className="text-xs uppercase tracking-widest text-gold font-medium">Upcoming</p>
        <p className="text-xs text-ink-muted">Next 14 days</p>
      </div>

      <div className="flex-1 px-4 py-3">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 flex-1" style={{ width: `${65 + i * 5}%` }} />
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-4">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-ink leading-snug truncate">{e.title}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{formatEventDate(e.start)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 pb-4 pt-0">
        <div className="border-t border-white/5 pt-3">
          <p className="text-xs text-gold/50 flex items-center gap-1 tracking-wide">
            View full calendar <span className="text-[10px]">→</span>
          </p>
        </div>
      </div>
    </button>
  )
}
