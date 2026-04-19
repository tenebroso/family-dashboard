import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'
import { useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const ADMIN_QUERY = gql`
  query ChoresAdmin {
    people {
      id
      name
      color
      chores {
        id
        title
        dayOfWeek
        isActive
      }
    }
  }
`

const CREATE_CHORE = gql`
  mutation CreateChore($input: CreateChoreInput!) {
    createChore(input: $input) {
      id
      title
      dayOfWeek
      isActive
    }
  }
`

const UPDATE_CHORE = gql`
  mutation UpdateChore($input: UpdateChoreInput!) {
    updateChore(input: $input) {
      id
      title
      dayOfWeek
      isActive
    }
  }
`

const DELETE_CHORE = gql`
  mutation DeleteChore($id: ID!) {
    deleteChore(id: $id)
  }
`

type Chore = { id: string; title: string; dayOfWeek: number[]; isActive: boolean }
type Person = { id: string; name: string; color: string; chores: Chore[] }

function DayBadges({ days }: { days: number[] }) {
  if (days.length === 0) return <span className="text-xs text-ink-muted">Every day</span>
  return (
    <span className="text-xs text-ink-muted">
      {days.map(d => DAYS[d]).join(', ')}
    </span>
  )
}

function EditChoreForm({ chore, onSave, onCancel }: {
  chore: Chore
  onSave: (title: string, dayOfWeek: number[]) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(chore.title)
  const [selectedDays, setSelectedDays] = useState<number[]>(chore.dayOfWeek)

  const toggleDay = (d: number) =>
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())

  return (
    <div className="mt-2 p-3 bg-surface rounded-lg border border-gold/20 space-y-3">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full bg-surface-card text-ink text-sm rounded-md px-3 py-2 border border-gold/20 outline-none focus:border-gold/50"
        placeholder="Chore title"
      />
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map((label, i) => (
          <button
            key={i}
            onClick={() => toggleDay(i)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedDays.includes(i)
                ? 'bg-gold text-surface'
                : 'bg-surface-card text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-ink-muted">No days selected = every day</p>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(title.trim(), selectedDays)}
          disabled={!title.trim()}
          className="px-4 py-1.5 bg-gold text-surface text-sm font-medium rounded-md hover:bg-gold-light transition-colors disabled:opacity-40"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-ink-muted text-sm hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const LAST_PERSON_KEY = 'choresAdmin_lastPersonId'

function AddChoreForm({ people, onAdded }: { people: Person[]; onAdded: () => void }) {
  const [title, setTitle] = useState('')
  const [personId, setPersonId] = useState(() => {
    const saved = localStorage.getItem(LAST_PERSON_KEY)
    return (saved && people.some(p => p.id === saved)) ? saved : (people[0]?.id ?? '')
  })
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [createChore, { loading }] = useMutation(CREATE_CHORE, {
    refetchQueries: ['ChoresAdmin'],
  })

  const toggleDay = (d: number) =>
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())

  const handlePersonChange = (id: string) => {
    setPersonId(id)
    localStorage.setItem(LAST_PERSON_KEY, id)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    await createChore({ variables: { input: { title: title.trim(), personId, dayOfWeek: selectedDays } } })
    setTitle('')
    setSelectedDays([])
    localStorage.setItem(LAST_PERSON_KEY, personId)
    onAdded()
  }

  return (
    <div className="bg-surface-raised border border-gold/30 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-display font-bold text-gold uppercase tracking-wide">Add Chore</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Chore title"
          className="bg-surface-card text-ink text-sm rounded-md px-3 py-2 border border-gold/20 outline-none focus:border-gold/50"
        />
        <select
          value={personId}
          onChange={e => handlePersonChange(e.target.value)}
          className="bg-surface-card text-ink text-sm rounded-md px-3 py-2 border border-gold/20 outline-none focus:border-gold/50"
        >
          {people.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-[11px] text-ink-muted mb-2 uppercase tracking-wide">Days (empty = every day)</p>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((label, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedDays.includes(i)
                  ? 'bg-gold text-surface'
                  : 'bg-surface-card text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!title.trim() || loading}
        className="px-5 py-2 bg-gold text-surface text-sm font-medium rounded-md hover:bg-gold-light transition-colors disabled:opacity-40"
      >
        {loading ? 'Adding…' : 'Add Chore'}
      </button>
    </div>
  )
}

function PersonColumn({ person }: { person: Person }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [updateChore] = useMutation(UPDATE_CHORE, { refetchQueries: ['ChoresAdmin'] })
  const [deleteChore] = useMutation(DELETE_CHORE, { refetchQueries: ['ChoresAdmin'] })

  const handleSave = async (chore: Chore, title: string, dayOfWeek: number[]) => {
    await updateChore({ variables: { input: { id: chore.id, title, dayOfWeek } } })
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this chore?')) return
    await deleteChore({ variables: { id } })
  }

  return (
    <div className="bg-surface-raised border border-gold/20 rounded-xl overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ borderLeft: `3px solid ${person.color}` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display shrink-0"
          style={{ backgroundColor: person.color, color: '#111111' }}
        >
          {person.name[0]}
        </div>
        <span className="font-display font-bold text-base text-ink">{person.name}</span>
        <span className="ml-auto text-[11px] text-ink-muted">{person.chores.length} chore{person.chores.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="p-3 space-y-1">
        {person.chores.length === 0 && (
          <p className="text-ink-muted text-sm px-2 py-1">No chores</p>
        )}
        {person.chores.map(chore => (
          <div key={chore.id}>
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-card group">
              <span className="flex-1 text-sm text-ink">{chore.title}</span>
              <DayBadges days={chore.dayOfWeek} />
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingId(editingId === chore.id ? null : chore.id)}
                  className="px-2.5 py-1 text-xs text-gold border border-gold/30 rounded hover:bg-gold/10 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(chore.id)}
                  className="px-2.5 py-1 text-xs text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            {editingId === chore.id && (
              <EditChoreForm
                chore={chore}
                onSave={(title, dayOfWeek) => handleSave(chore, title, dayOfWeek)}
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChoresAdminPage() {
  const { data, loading } = useQuery(ADMIN_QUERY)
  const [showAdd, setShowAdd] = useState(false)
  const people: Person[] = data?.people ?? []

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Chores Admin</h1>
          <p className="text-ink-muted text-sm mt-0.5">Manage chore assignments</p>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="px-4 py-2 bg-gold text-surface text-sm font-medium rounded-md hover:bg-gold-light transition-colors"
        >
          {showAdd ? 'Close' : 'Add Chore'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6">
          <AddChoreForm people={people} onAdded={() => setShowAdd(false)} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-raised border border-gold/20 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {people.map(person => (
            <PersonColumn key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  )
}
