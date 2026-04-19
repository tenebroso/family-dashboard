import { useMemo } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

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

function formatEventDate(isoString: string, allDay: boolean): string {
  const d = new Date(isoString)
  const today = new Date()
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CalendarShell() {
  const { start, end } = useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + 14)
    return { start: now.toISOString(), end: end.toISOString() }
  }, [])

  const { data, loading } = useQuery(CALENDAR_QUERY, {
    variables: { start, end },
  })

  const events: Array<{ id: string; title: string; start: string; allDay: boolean }> =
    data?.calendarEvents?.slice(0, 5) ?? []

  return (
    <div className="bg-surface-raised rounded-lg flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-baseline justify-between border-b border-white/5">
        <p className="text-xs uppercase tracking-widest text-gold font-medium">Upcoming</p>
        <p className="text-xs text-ink-muted">Next 14 days</p>
      </div>

      {/* Events */}
      <div className="flex-1 px-4 py-3">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="animate-pulse w-2 h-2 rounded-full bg-surface-card flex-shrink-0" />
                <div className="animate-pulse h-4 bg-surface-card rounded flex-1" style={{ width: `${65 + i * 5}%` }} />
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
                  <p className="text-xs text-ink-muted mt-0.5">{formatEventDate(e.start, e.allDay)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-0">
        <div className="border-t border-white/5 pt-3">
          <a
            href="/calendar"
            className="text-xs text-gold/50 hover:text-gold transition-colors flex items-center gap-1 tracking-wide"
          >
            View full calendar
            <span className="text-[10px]">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
