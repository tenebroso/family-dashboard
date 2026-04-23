import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useNavigate, useMatch } from 'react-router-dom'
import { useActivePerson } from '../contexts/PersonContext'
import type { PersonSlug } from '../contexts/PersonContext'

const PEOPLE_QUERY = gql`
  query PersonRail {
    people {
      id
      name
      color
    }
  }
`

interface Person {
  id: string
  name: string
  color: string
}

function slugify(name: string): PersonSlug {
  return name.toLowerCase() as PersonSlug
}

const PERSON_VARS: Record<string, string> = {
  jon:     'var(--p-jon)',
  krysten: 'var(--p-krysten)',
  harry:   'var(--p-harry)',
  ruby:    'var(--p-ruby)',
  mylo:    'var(--p-mylo)',
}

export default function PersonRail() {
  const { data } = useQuery(PEOPLE_QUERY)
  const { activePerson, setActivePerson } = useActivePerson()
  const navigate = useNavigate()
  const people: Person[] = data?.people ?? []

  const hasActive = activePerson !== null

  const match = useMatch('/:personSlug/:route*')

  function handleSelect(slug: PersonSlug) {

    setActivePerson(slug)
    navigate(match ? `/${slug}/${match.params.route ?? ''}` : `/${slug}`)
  }

  function handleClear() {
    setActivePerson(null)
  }

  return (
    <div className={`people-rail${hasActive ? ' dim' : ''}`}>
      {people.map(p => {
        const slug = slugify(p.name)
        const pColor = PERSON_VARS[slug] ?? p.color
        const isActive = activePerson === slug
        return (
          <button
            key={p.id}
            className="person-chip"
            aria-pressed={isActive}
            onClick={() => handleSelect(slug)}
          >
            <div className="person-avatar" style={{ background: pColor }}>
              {p.name[0]}
            </div>
            <span className="person-name">{p.name}</span>
          </button>
        )
      })}
      {hasActive && (
        <button className="people-rail-clear" onClick={handleClear}>
          Show all
        </button>
      )}
    </div>
  )
}
