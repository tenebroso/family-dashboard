import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import Skeleton from './Skeleton'
import { useActivePerson } from '../contexts/PersonContext'

const DATE_KEY = dayjs().format('YYYY-MM-DD')

const PEOPLE_QUERY = gql`
  query ChoresSummary($dateKey: String!) {
    people {
      id
      name
      completionRate(dateKey: $dateKey)
    }
  }
`

const PERSON_COLORS: Record<string, string> = {
  jon:     'var(--p-jon)',
  krysten: 'var(--p-krysten)',
  harry:   'var(--p-harry)',
  ruby:    'var(--p-ruby)',
  mylo:    'var(--p-mylo)',
}

export default function ChoresSummaryShell() {
  const { data, loading } = useQuery(PEOPLE_QUERY, { variables: { dateKey: DATE_KEY } })
  const { activePerson } = useActivePerson()
  const { personSlug } = useParams<{ personSlug: string }>()
  const navigate = useNavigate()

  const currentSlug = activePerson ?? personSlug ?? null

  const allPeople: { id: string; name: string; completionRate: number }[] = data?.people ?? []
  const people = currentSlug
    ? allPeople.filter(p => p.name.toLowerCase() === currentSlug)
    : allPeople

  return (
    <button
      onClick={() => navigate(currentSlug ? `/${currentSlug}/chores` : '/chores')}
      className="tile chores-tile w-full text-left hover:shadow-lg transition-shadow"
      style={{ cursor: 'pointer' }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--ink-3)' }}>
        Chores today
      </p>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-2.5 flex-1 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {people.map(p => {
            const slug = p.name.toLowerCase()
            const pColor = PERSON_COLORS[slug] ?? 'var(--accent)'
            const pct = Math.round(p.completionRate * 100)
            return (
              <div key={p.id} className="flex items-center gap-2">
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
              </div>
            )
          })}
        </div>
      )}
    </button>
  )
}
