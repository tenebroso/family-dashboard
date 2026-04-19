import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'

const MESSAGE_QUERY = gql`
  query ActiveMessage {
    activeMessage {
      id
      author
      body
      createdAt
    }
  }
`

export default function MessageWidget() {
  const { data, loading } = useQuery(MESSAGE_QUERY)
  const msg = data?.activeMessage

  if (!loading && !msg) return null

  return (
    <AnimatePresence>
      {(loading || msg) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          className="bg-surface-raised border-l-2 border-l-gold rounded-lg p-4"
        >
          <p className="text-[10px] uppercase tracking-widest text-gold font-medium mb-2">Message</p>
          {loading ? (
            <div className="space-y-1.5">
              <div className="animate-pulse h-4 w-full bg-surface-card rounded" />
              <div className="animate-pulse h-4 w-3/4 bg-surface-card rounded" />
              <div className="animate-pulse h-3 w-16 bg-surface-card rounded mt-1" />
            </div>
          ) : (
            <>
              <p className="text-sm text-ink leading-relaxed">{msg.body}</p>
              <p className="text-xs text-ink-muted mt-2">— {msg.author}</p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
