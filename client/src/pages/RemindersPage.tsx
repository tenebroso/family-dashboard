import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'
import { useSearchParams } from 'react-router-dom'

const PEOPLE_QUERY = gql`
  query PeopleForReminders {
    people {
      id
      name
      color
    }
  }
`

const REMINDERS_QUERY = gql`
  query Reminders($personId: ID!) {
    reminders(personId: $personId) {
      id
      personId
      text
      dueDate
      done
      createdAt
    }
  }
`

const ADD_REMINDER = gql`
  mutation AddReminder($personId: ID!, $text: String!, $dueDate: String) {
    addReminder(personId: $personId, text: $text, dueDate: $dueDate) {
      id
      personId
      text
      dueDate
      done
      createdAt
    }
  }
`

const TOGGLE_REMINDER = gql`
  mutation ToggleReminder($id: ID!) {
    toggleReminder(id: $id) {
      id
      done
    }
  }
`

const DELETE_REMINDER = gql`
  mutation DeleteReminder($id: ID!) {
    deleteReminder(id: $id)
  }
`

type Person = { id: string; name: string; color: string }
type Reminder = { id: string; personId: string; text: string; dueDate: string | null; done: boolean; createdAt: string }

const today = new Date().toISOString().slice(0, 10)

export default function RemindersPage() {
  const [searchParams] = useSearchParams()
  const { data: peopleData, loading: peopleLoading } = useQuery<{ people: Person[] }>(PEOPLE_QUERY)
  const people = peopleData?.people ?? []

  const initialPersonId = searchParams.get('person') ?? ''
  const [selectedPersonId, setSelectedPersonId] = useState(initialPersonId)
  const personId = selectedPersonId || people[0]?.id || ''

  const { data, loading } = useQuery<{ reminders: Reminder[] }>(REMINDERS_QUERY, {
    variables: { personId },
    skip: !personId,
  })
  const reminders = data?.reminders ?? []

  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [addReminder, { loading: adding }] = useMutation(ADD_REMINDER, {
    refetchQueries: ['Reminders'],
    onCompleted: () => { setText(''); setDueDate('') },
  })

  const [toggleReminder] = useMutation(TOGGLE_REMINDER, {
    refetchQueries: ['Reminders'],
  })

  const [deleteReminder] = useMutation(DELETE_REMINDER, {
    refetchQueries: ['Reminders'],
  })

  const selectedPerson = people.find((p) => p.id === personId)

  const undone = reminders.filter((r) => !r.done)
  const done = reminders.filter((r) => r.done)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !personId) return
    addReminder({
      variables: {
        personId,
        text: text.trim(),
        dueDate: dueDate || undefined,
      },
    })
  }

  if (peopleLoading) return null

  return (
    <div className="max-w-xl mx-auto p-6 pt-8">
      <div className="flex justify-end mb-4">
        <a href="/" className="text-xs text-ink-muted hover:text-ink transition-colors">← Home</a>
      </div>
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Reminders</h1>
      <p className="text-sm text-ink-muted mb-6">Personal to-dos for each family member.</p>

      {/* Person selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {people.map((person) => {
          const active = person.id === personId
          return (
            <button
              key={person.id}
              onClick={() => setSelectedPersonId(person.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? person.color + '22' : 'transparent',
                border: `1px solid ${active ? person.color : 'rgba(255,255,255,0.08)'}`,
                color: active ? person.color : '#9A9488',
              }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: person.color }}
              >
                {person.name[0]}
              </span>
              {person.name}
            </button>
          )
        })}
      </div>

      {/* Add reminder form */}
      <form onSubmit={handleSubmit} className="bg-surface-raised rounded-lg p-4 mb-6 space-y-3">
        <p className="text-xs uppercase tracking-widest text-gold mb-1">
          Add Reminder{selectedPerson ? ` for ${selectedPerson.name}` : ''}
        </p>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reminder text *"
          className="w-full bg-surface rounded-lg px-3 py-2.5 text-ink text-sm placeholder:text-ink-muted outline-none focus:ring-1 focus:ring-gold/40"
          required
        />
        <div className="flex gap-3">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 bg-surface rounded-lg px-3 py-2.5 text-ink text-sm outline-none focus:ring-1 focus:ring-gold/40"
            style={{ colorScheme: 'dark' }}
          />
          <button
            type="submit"
            disabled={adding || !text.trim()}
            className="bg-gold text-surface font-semibold rounded-lg text-sm px-5 py-2.5 disabled:opacity-40 transition-opacity"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>

      {/* Reminders list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-shimmer h-12 rounded-lg" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <p className="text-sm text-ink-muted py-8 text-center">
          {selectedPerson ? `${selectedPerson.name} has no reminders yet.` : 'No reminders yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {undone.length > 0 && (
            <div className="space-y-1">
              {undone.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  personColor={selectedPerson?.color}
                  onToggle={() => toggleReminder({ variables: { id: r.id } })}
                  onDelete={() => deleteReminder({ variables: { id: r.id } })}
                />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-muted mb-2">Done</p>
              <div className="space-y-1">
                {done.map((r) => (
                  <ReminderRow
                    key={r.id}
                    reminder={r}
                    personColor={selectedPerson?.color}
                    onToggle={() => toggleReminder({ variables: { id: r.id } })}
                    onDelete={() => deleteReminder({ variables: { id: r.id } })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ReminderRow({
  reminder,
  personColor,
  onToggle,
  onDelete,
}: {
  reminder: Reminder
  personColor?: string
  onToggle: () => void
  onDelete: () => void
}) {
  const isDueToday = reminder.dueDate === today
  const isDueLabel = reminder.dueDate
    ? isDueToday
      ? 'Due today'
      : reminder.dueDate < today && !reminder.done
        ? `Overdue · ${reminder.dueDate}`
        : reminder.dueDate
    : null

  return (
    <div className={`flex items-center gap-3 bg-surface-raised rounded-lg px-3 py-3 ${reminder.done ? 'opacity-50' : ''}`}>
      <button
        onClick={onToggle}
        className="w-5 h-5 flex-shrink-0 rounded border border-white/20 flex items-center justify-center hover:border-gold/60 transition-colors"
        aria-label={reminder.done ? 'Mark undone' : 'Mark done'}
        style={reminder.done ? { borderColor: personColor + '60' } : undefined}
      >
        {reminder.done && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" style={{ color: personColor ?? '#C9A84C' }}>
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-sm text-ink ${reminder.done ? 'line-through' : ''}`}>{reminder.text}</span>
        {isDueLabel && (
          <span
            className="block text-xs mt-0.5"
            style={{ color: isDueToday && !reminder.done ? '#C9A84C' : '#9A9488' }}
          >
            {isDueLabel}
          </span>
        )}
      </div>
      <button
        onClick={onDelete}
        className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-ink-muted hover:text-ink transition-colors rounded"
        aria-label="Delete reminder"
      >
        ×
      </button>
    </div>
  )
}
