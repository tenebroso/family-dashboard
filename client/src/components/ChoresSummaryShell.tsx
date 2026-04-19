import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const DATE_KEY = dayjs().format('YYYY-MM-DD')

const PEOPLE_QUERY = gql`
  query ChoresSummary($dateKey: String!) {
    people {
      id
      name
      color
      completionRate(dateKey: $dateKey)
    }
  }
`

export default function ChoresSummaryShell() {
  const { data, loading } = useQuery(PEOPLE_QUERY, { variables: { dateKey: DATE_KEY } })
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/chores')}
      className="w-full bg-surface-raised rounded-lg p-4 text-left hover:bg-surface-card transition-colors"
    >
      <p className="text-[10px] uppercase tracking-widest text-gold font-medium mb-3">Chores Today</p>
      {loading ? (
        <div className="flex gap-2 flex-wrap">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="animate-pulse w-8 h-8 rounded-full bg-surface-card" />
              <div className="animate-pulse h-3 w-12 bg-surface-card rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.people.map((p: { id: string; name: string; color: string; completionRate: number }) => {
            const pct = Math.round(p.completionRate * 100)
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display flex-shrink-0"
                  style={{ backgroundColor: p.color, color: '#111111' }}
                >
                  {p.name[0]}
                </div>
                <span className="text-xs text-ink-muted w-16 truncate">{p.name}</span>
                <div className="flex-1 h-1 bg-surface-card rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: p.color }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color: p.color }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      )}
    </button>
  )
}
