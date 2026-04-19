import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import Skeleton from './Skeleton'
import { useAerial } from '../contexts/AerialContext'

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
  const aerial = useAerial()

  if (!loading && !msg) return null

  return (
    <AnimatePresence>
      {(loading || msg) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          className={`border-l-2 border-l-gold rounded-lg p-4 ${aerial ? 'backdrop-blur-md bg-black/50 ring-1 ring-white/10' : 'bg-surface-raised'}`}
        >
          <p className="text-[10px] uppercase tracking-widest text-gold font-medium mb-2">Message</p>
          {loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-16 mt-1" />
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
