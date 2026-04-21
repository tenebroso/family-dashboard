import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

const MESSAGES_QUERY = gql`
  query AllMessages {
    messages(limit: 500) {
      id
      personSlug
      body
      parsedType
      parsedDone
      createdAt
    }
  }
`

const DELETE_MESSAGE = gql`
  mutation DeleteMessage($id: ID!) {
    deleteMessage(id: $id)
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

function formatDate(val: string): string {
  const ms = Number(val)
  const date = Number.isFinite(ms) ? new Date(ms) : new Date(val)
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function MessageAdminPage() {
  const { data, loading } = useQuery(MESSAGES_QUERY)
  const [deleteMessage] = useMutation(DELETE_MESSAGE, {
    refetchQueries: [{ query: MESSAGES_QUERY }],
  })
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const messages: Message[] = [...(data?.messages ?? [])].reverse()

  async function handleDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id)
      return
    }
    setConfirmId(null)
    await deleteMessage({ variables: { id } })
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Message History</h1>
        <span className="admin-count">{messages.length} messages</span>
      </div>

      {loading ? (
        <div className="admin-empty">Loading…</div>
      ) : messages.length === 0 ? (
        <div className="admin-empty">No messages yet.</div>
      ) : (
        <div className="admin-message-list">
          {messages.map(msg => (
            <div key={msg.id} className="admin-message-row">
              <div
                className="admin-message-avatar"
                style={{ background: `var(--p-${msg.personSlug})` }}
              >
                {(PERSON_NAMES[msg.personSlug] ?? msg.personSlug)[0].toUpperCase()}
              </div>
              <div className="admin-message-body">
                <div className="admin-message-meta">
                  <span className="admin-message-name">
                    {PERSON_NAMES[msg.personSlug] ?? msg.personSlug}
                  </span>
                  <span className="admin-message-time">{formatDate(msg.createdAt)}</span>
                  {msg.parsedDone && msg.parsedType === 'grocery' && (
                    <span className="parsed-chip parsed-chip--grocery">🛒 Grocery</span>
                  )}
                  {msg.parsedDone && msg.parsedType === 'reminder' && (
                    <span className="parsed-chip parsed-chip--reminder">📅 Calendar</span>
                  )}
                </div>
                <p className="admin-message-text">{msg.body}</p>
              </div>
              <button
                className={`admin-delete-btn${confirmId === msg.id ? ' confirm' : ''}`}
                onClick={() => handleDelete(msg.id)}
                title={confirmId === msg.id ? 'Tap again to confirm delete' : 'Delete message'}
              >
                {confirmId === msg.id ? 'Confirm?' : <Trash2 size={15} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
