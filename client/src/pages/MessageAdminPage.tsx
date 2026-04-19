import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'

const ACTIVE_MESSAGE_QUERY = gql`
  query ActiveMessageAdmin {
    activeMessage {
      id
      author
      body
      displayUntil
      createdAt
    }
  }
`

const CREATE_MESSAGE = gql`
  mutation CreateMessage($author: String!, $body: String!, $displayUntil: String) {
    createMessage(author: $author, body: $body, displayUntil: $displayUntil) {
      id
      author
      body
      displayUntil
      createdAt
    }
  }
`

const DEACTIVATE_MESSAGE = gql`
  mutation DeactivateMessage($id: ID!) {
    deactivateMessage(id: $id)
  }
`

export default function MessageAdminPage() {
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [displayUntil, setDisplayUntil] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data, loading } = useQuery(ACTIVE_MESSAGE_QUERY)
  const activeMessage = data?.activeMessage

  const [createMessage, { loading: creating }] = useMutation(CREATE_MESSAGE, {
    refetchQueries: ['ActiveMessageAdmin'],
    onCompleted: () => {
      setAuthor('')
      setBody('')
      setDisplayUntil('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    },
  })

  const [deactivateMessage] = useMutation(DEACTIVATE_MESSAGE, {
    refetchQueries: ['ActiveMessageAdmin'],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !body.trim()) return
    createMessage({
      variables: {
        author: author.trim(),
        body: body.trim(),
        displayUntil: displayUntil || undefined,
      },
    })
  }

  const charsLeft = 280 - body.length

  return (
    <div className="max-w-xl mx-auto p-6 pt-8">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Post a Message</h1>
      <p className="text-sm text-ink-muted mb-8">This message will appear on the dashboard for everyone to see.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gold mb-2">From</label>
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="Mom, Dad, …"
            className="w-full bg-surface-raised rounded-lg px-4 py-3 text-ink text-sm placeholder:text-ink-muted outline-none focus:ring-1 focus:ring-gold/40"
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-gold mb-2">Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 280))}
            placeholder="What do you want the family to see?"
            rows={4}
            className="w-full bg-surface-raised rounded-lg px-4 py-3 text-ink text-sm placeholder:text-ink-muted outline-none focus:ring-1 focus:ring-gold/40 resize-none"
            required
          />
          <p className={`text-xs mt-1 text-right ${charsLeft < 40 ? 'text-gold' : 'text-ink-muted'}`}>
            {charsLeft} characters left
          </p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-gold mb-2">
            Display Until <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={displayUntil}
            onChange={e => setDisplayUntil(e.target.value)}
            className="w-full bg-surface-raised rounded-lg px-4 py-3 text-ink text-sm outline-none focus:ring-1 focus:ring-gold/40"
          />
        </div>

        <button
          type="submit"
          disabled={creating || !author.trim() || !body.trim()}
          className="w-full py-3 bg-gold text-surface font-semibold rounded-lg text-sm disabled:opacity-40 transition-opacity"
        >
          {creating ? 'Posting…' : 'Post Message'}
        </button>

        {submitted && (
          <p className="text-center text-sm text-gold">Your message is now live on the dashboard.</p>
        )}
      </form>

      {/* Active message preview */}
      <div className="mt-10">
        <p className="text-xs uppercase tracking-widest text-gold mb-4">Currently Active</p>
        {loading ? (
          <div className="space-y-2">
            <div className="animate-pulse h-4 w-3/4 bg-surface-card rounded" />
            <div className="animate-pulse h-4 w-1/2 bg-surface-card rounded" />
          </div>
        ) : activeMessage ? (
          <div className="bg-surface-raised border-l-2 border-l-gold rounded-lg p-4">
            <p className="text-sm text-ink leading-relaxed">{activeMessage.body}</p>
            <p className="text-xs text-ink-muted mt-2">— {activeMessage.author}</p>
            {activeMessage.displayUntil && (
              <p className="text-xs text-ink-muted mt-1">
                Expires {new Date(activeMessage.displayUntil).toLocaleString()}
              </p>
            )}
            <button
              onClick={() => deactivateMessage({ variables: { id: activeMessage.id } })}
              className="mt-4 text-xs text-ink-muted hover:text-ink border border-white/10 rounded px-3 py-1.5 transition-colors"
            >
              Deactivate
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No active message.</p>
        )}
      </div>
    </div>
  )
}
