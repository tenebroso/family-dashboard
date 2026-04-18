import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'

const DATE_KEY = dayjs().format('YYYY-MM-DD')
const DAY_OF_WEEK = dayjs().day()

const CHORES_QUERY = gql`
  query ChoresPage($dayOfWeek: Int, $dateKey: String!) {
    people {
      id
      name
      color
      completionRate(dateKey: $dateKey)
      chores(dayOfWeek: $dayOfWeek) {
        id
        title
        isCompletedOn(dateKey: $dateKey)
      }
    }
  }
`

const COMPLETE_CHORE = gql`
  mutation CompleteChore($choreId: ID!, $dateKey: String!) {
    completeChore(choreId: $choreId, dateKey: $dateKey) {
      id
      choreId
      dateKey
    }
  }
`

const UNCOMPLETE_CHORE = gql`
  mutation UncompleteChore($choreId: ID!, $dateKey: String!) {
    uncompleteChore(choreId: $choreId, dateKey: $dateKey)
  }
`

type Chore = { id: string; title: string; isCompletedOn: boolean }
type Person = { id: string; name: string; color: string; completionRate: number; chores: Chore[] }

function PersonCard({ person, completed, onToggle }: {
  person: Person
  completed: Set<string>
  onToggle: (choreId: string, isCompleted: boolean) => void
}) {
  const doneCount = person.chores.filter(c => completed.has(c.id)).length
  const total = person.chores.length
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  return (
    <div className="bg-surface-raised rounded-xl overflow-hidden border border-gold/20 shadow-[0_0_12px_rgba(201,168,76,0.05)]">
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderLeft: `4px solid ${person.color}` }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-display shrink-0"
          style={{ backgroundColor: person.color, color: '#111111' }}
        >
          {person.name[0]}
        </div>
        <span className="font-display font-bold text-lg text-ink">{person.name}</span>
      </div>

      <div className="px-5 pb-2">
        {person.chores.length === 0 ? (
          <p className="text-ink-muted text-sm py-3">No chores today</p>
        ) : (
          <ul className="divide-y divide-surface-card">
            {person.chores.map(chore => {
              const isDone = completed.has(chore.id)
              return (
                <li key={chore.id}>
                  <button
                    onClick={() => onToggle(chore.id, isDone)}
                    className="w-full flex items-center gap-3 py-3 min-h-[44px] text-left"
                    aria-label={`${chore.title} – ${isDone ? 'completed' : 'not completed'}`}
                  >
                    <motion.div
                      className="w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0"
                      style={{
                        borderColor: isDone ? person.color : 'rgba(154,148,136,0.4)',
                        backgroundColor: isDone ? person.color : 'transparent',
                      }}
                      animate={{ scale: isDone ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isDone && (
                        <motion.svg
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.15 }}
                          width="12" height="12" viewBox="0 0 12 12" fill="none"
                        >
                          <path d="M2 6l3 3 5-5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                      )}
                    </motion.div>
                    <span
                      className="text-sm font-body transition-all duration-200"
                      style={{
                        color: isDone ? 'var(--color-ink-muted)' : 'var(--color-ink)',
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
        )}
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-ink-muted uppercase tracking-wide">Progress</span>
          <span className="text-[11px] font-medium" style={{ color: person.color }}>
            {doneCount} / {total} done
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-card overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: person.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ChoresPage() {
  const { data, loading } = useQuery(CHORES_QUERY, {
    variables: { dayOfWeek: DAY_OF_WEEK, dateKey: DATE_KEY },
  })

  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!data) return
    const ids = new Set<string>()
    for (const person of data.people as Person[]) {
      for (const chore of person.chores) {
        if (chore.isCompletedOn) ids.add(chore.id)
      }
    }
    setCompleted(ids)
  }, [data])

  const [completeChore] = useMutation(COMPLETE_CHORE)
  const [uncompleteChore] = useMutation(UNCOMPLETE_CHORE)

  const handleToggle = (choreId: string, isDone: boolean) => {
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

  const people: Person[] = data?.people ?? []
  const todayLabel = dayjs().format('dddd, MMMM D')

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Chores</h1>
        <p className="text-ink-muted text-sm mt-0.5">{todayLabel}</p>
      </div>

      {/* Summary row */}
      {!loading && people.length > 0 && (
        <div className="bg-surface-raised border border-gold/20 rounded-xl p-4 mb-6 flex justify-around">
          {people.map(p => {
            const doneCount = p.chores.filter(c => completed.has(c.id)).length
            const total = p.chores.length
            const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
            return (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold font-display"
                  style={{ backgroundColor: p.color, color: '#111111' }}
                >
                  {p.name[0]}
                </div>
                <span className="text-[11px] text-ink-muted">{p.name}</span>
                <span className="text-[11px] font-medium" style={{ color: p.color }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-raised border border-gold/20 rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {people.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              completed={completed}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
