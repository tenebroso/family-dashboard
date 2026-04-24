import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Person {
  id: string
  name: string
  color: string
}

export default function LinkAccountPage() {
  const navigate = useNavigate()
  const [people, setPeople] = useState<Person[]>([])
  const [googleEmail, setGoogleEmail] = useState('')
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    fetch('/auth/link-status', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.people) setPeople(data.people)
        if (data.googleEmail) setGoogleEmail(data.googleEmail)
      })
  }, [])

  async function linkAs(person: Person) {
    if (linking) return
    setLinking(true)
    const res = await fetch('/auth/link-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ personId: person.id }),
    })
    if (res.ok) {
      navigate(`/${person.name.toLowerCase()}`, { replace: true })
      window.location.reload()
    } else {
      setLinking(false)
    }
  }

  return (
    <div className="lobby">
      <div style={{ textAlign: 'center' }}>
        <h1 className="lobby-heading">
          Welcome!{' '}
          <span className="lobby-heading-sub">who are you?</span>
        </h1>
        {googleEmail && (
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-3)', marginTop: '0.5rem' }}>
            Signed in as {googleEmail}
          </p>
        )}
        <p style={{ fontSize: '0.8125rem', color: 'var(--ink-4)', marginTop: '0.25rem' }}>
          You&rsquo;ll always log in as this person.
        </p>
      </div>

      <div className="lobby-grid">
        {people.map((p) => (
          <button
            key={p.id}
            className="lobby-card"
            style={{ '--person-color': p.color } as React.CSSProperties}
            onClick={() => linkAs(p)}
            disabled={linking}
          >
            <div className="lobby-avatar">{p.name[0]}</div>
            <span className="lobby-name">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
