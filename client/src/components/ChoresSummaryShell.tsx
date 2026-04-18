import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const PEOPLE_QUERY = gql`
  query ChoresSummaryShell {
    people {
      id
      name
      color
    }
  }
`

export default function ChoresSummaryShell() {
  const { data, loading } = useQuery(PEOPLE_QUERY)

  return (
    <div className="bg-surface-raised border border-gold/20 rounded-xl p-5 shadow-[0_0_12px_rgba(201,168,76,0.05)]">
      <p className="text-[10px] uppercase tracking-widest text-gold font-medium mb-4">Chores</p>
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
          {data?.people.map((p: { id: string; name: string; color: string }) => (
            <div key={p.id} className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold font-display"
                style={{ backgroundColor: p.color, color: '#111111' }}
              >
                {p.name[0]}
              </div>
              <span className="text-[11px] text-ink-muted">{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
