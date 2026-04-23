import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'
import { useRef, useEffect, useState, type FormEvent } from 'react'
import { useActivePerson } from '../contexts/PersonContext'

const MESSAGES_QUERY = gql`
  query Messages {
    messages(limit: 10) {
      id
      personSlug
      body
      parsedType
      parsedDone
      createdAt
    }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($body: String!, $personSlug: String!) {
    sendMessage(body: $body, personSlug: $personSlug) {
      id
      personSlug
      body
      parsedType
      parsedDone
      createdAt
    }
  }
`

interface Message {
  id: string
  personSlug: string
  body: string
  parsedType: string | null
  parsedDone: boolean
  createdAt: string
}

const PERSON_NAMES: Record<string, string> = {
  jon: 'Jon', krysten: 'Krysten', harry: 'Harry', ruby: 'Ruby', mylo: 'Mylo',
}

function relativeTime(val: string): string {
  const ms = Number(val)
  const date = Number.isFinite(ms) ? new Date(ms) : new Date(val)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function MessageWidget() {
  const { data, loading } = useQuery<{ messages: Message[] }>(MESSAGES_QUERY)
  const [send] = useMutation(SEND_MESSAGE, {
    refetchQueries: [{ query: MESSAGES_QUERY }],
  })
  const { activePerson } = useActivePerson()
  const [draft, setDraft] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)
  const messages: Message[] = data?.messages ?? []

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages.length])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !activePerson) return
    setDraft('')
    await send({ variables: { body, personSlug: activePerson } })
  }

  return (
    <div className="tile message-tile">
      <div className="tile-eyebrow">Family thread</div>

      <div className="thread" ref={threadRef}>
        {loading ? (
          <div className="thread-empty">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="thread-empty">No messages yet</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="bubble">
              <div
                className="bubble-avatar"
                style={{ background: `var(--p-${msg.personSlug})` }}
              >
                {(PERSON_NAMES[msg.personSlug] ?? msg.personSlug)[0].toUpperCase()}
              </div>
              <div className="bubble-content">
                <div className="bubble-meta">
                  <span className="bubble-name">
                    {PERSON_NAMES[msg.personSlug] ?? msg.personSlug}
                  </span>
                  <span className="bubble-time">{relativeTime(msg.createdAt)}</span>
                </div>
                <p className="bubble-body">{msg.body}</p>
                {msg.parsedDone && msg.parsedType === 'grocery' && (
                  <span className="parsed-chip parsed-chip--grocery">🛒 Added to grocery list</span>
                )}
                {msg.parsedDone && msg.parsedType === 'reminder' && (
                  <span className="parsed-chip parsed-chip--reminder">📅 Added to calendar</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form className="compose" onSubmit={handleSubmit}>
        <input
          className="compose-input"
          type="text"
          placeholder={activePerson ? 'Message the family…' : 'Pick a person to send…'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          disabled={!activePerson}
        />
        <button
          className="compose-send"
          type="submit"
          disabled={!draft.trim() || !activePerson}
        >
          Send
        </button>
      </form>
    </div>
  )
}
