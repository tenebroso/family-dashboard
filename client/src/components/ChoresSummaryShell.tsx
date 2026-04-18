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
      className="w-full bg-surface-raised border border-gold/20 rounded-xl p-5 shadow-[0_0_12px_rgba(201,168,76,0.05)] text-left hover:border-gold/40 transition-colors"
    >
      <p className="text-[10px] uppercase tracking-widest text-gold font-medium mb-4">Chores Today</p>
      {loading ? (
        <div className="flex justify-between">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="animate-pulse w-11 h-11 rounded-full bg-surface-card" />
              <div className="animate-pulse h-2.5 w-8 bg-surface-card rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-between">
          {data?.people.map((p: { id: string; name: string; color: string; completionRate: number }) => (
            <div key={p.id} className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold font-display"
                style={{ backgroundColor: p.color, color: '#111111' }}
              >
                {p.name[0]}
              </div>
              <span className="text-[11px] text-ink-muted">{p.name}</span>
              <span className="text-[11px] font-medium" style={{ color: p.color }}>
                {Math.round(p.completionRate * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
