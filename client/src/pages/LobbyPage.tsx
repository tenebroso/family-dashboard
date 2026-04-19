import { useNavigate } from 'react-router-dom'
import { useActivePerson } from '../contexts/PersonContext'
import type { PersonSlug } from '../contexts/PersonContext'
import { useTimeOfDay } from '../hooks/useTimeOfDay'

const PEOPLE: { slug: PersonSlug; name: string; initial: string; color: string }[] = [
  { slug: 'jon',     name: 'Jon',     initial: 'J', color: 'var(--p-jon)'     },
  { slug: 'krysten', name: 'Krysten', initial: 'K', color: 'var(--p-krysten)' },
  { slug: 'harry',   name: 'Harry',   initial: 'H', color: 'var(--p-harry)'   },
  { slug: 'ruby',    name: 'Ruby',    initial: 'R', color: 'var(--p-ruby)'    },
  { slug: 'mylo',    name: 'Mylo',    initial: 'M', color: 'var(--p-mylo)'    },
]

export default function LobbyPage() {
  const navigate = useNavigate()
  const { setActivePerson } = useActivePerson()
  const tod = useTimeOfDay()

  const greeting =
    tod === 'morning' ? 'Good morning' :
    tod === 'afternoon' ? 'Good afternoon' :
    'Good evening'

  function pick(slug: PersonSlug) {
    setActivePerson(slug)
    navigate(`/${slug}`)
  }

  return (
    <div className="lobby">
      <h1 className="lobby-heading">
        {greeting}, <span className="lobby-heading-sub">who&rsquo;s here?</span>
      </h1>
      <div className="lobby-grid">
        {PEOPLE.map(p => (
          <button
            key={p.slug}
            className="lobby-card"
            style={{ '--person-color': p.color } as React.CSSProperties}
            onClick={() => pick(p.slug)}
          >
            <div className="lobby-avatar">{p.initial}</div>
            <span className="lobby-name">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
