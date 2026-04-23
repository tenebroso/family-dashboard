import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { useCardClass } from '../hooks/useCardClass'
import Skeleton from './Skeleton'

const PEOPLE_REMINDERS_QUERY = gql`
  query PeopleReminders {
    people {
      id
      name
      color
      reminders {
        id
        done
        dueDate
      }
    }
  }
`

type Reminder = { id: string; done: boolean; dueDate: string | null }
type Person = { id: string; name: string; color: string; reminders: Reminder[] }

const today = new Date().toISOString().slice(0, 10)

export default function RemindersWidget() {
  const { data, loading } = useQuery<{ people: Person[] }>(PEOPLE_REMINDERS_QUERY, { pollInterval: 60_000 })
  const navigate = useNavigate()
  const cardClass = useCardClass()

  if (loading) {
    return (
      <div className={`${cardClass} p-4`}>
        <p className="text-xs uppercase tracking-widest text-gold mb-3">Reminders</p>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      </div>
    )
  }

  const people = data?.people ?? []
  const allClear = people.every((p) => p.reminders.filter((r) => !r.done).length === 0)

  return (
    <div className={`${cardClass} p-4`}>
      <p className="text-xs uppercase tracking-widest text-gold mb-3">Reminders</p>
      {allClear ? (
        <p className="text-sm text-ink-muted">All clear</p>
      ) : (
        <div className="space-y-2">
          {people.map((person) => {
            const undone = person.reminders.filter((r) => !r.done)
            const hasDueToday = undone.some((r) => r.dueDate === today)
            if (undone.length === 0) return null
            return (
              <button
                key={person.id}
                onClick={() => navigate(`/reminders?person=${person.id}`)}
                className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors text-left"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: person.color }}
                >
                  {person.name[0]}
                </span>
                <span className="text-sm text-ink flex-1">{person.name}</span>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: hasDueToday ? '#C9A84C' : '#9A9488' }}
                >
                  {undone.length}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <a
        href="/reminders"
        className="block text-xs text-ink-muted hover:text-ink mt-3 transition-colors"
        onClick={(e) => { e.preventDefault(); navigate('/reminders') }}
      >
        Manage reminders →
      </a>
    </div>
  )
}
