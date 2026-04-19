import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { motion } from 'framer-motion'

const WORD_QUERY = gql`
  query WordWidget {
    wordOfDay {
      word
      partOfSpeech
      definition
    }
  }
`

export default function WordWidget() {
  const { data, loading } = useQuery(WORD_QUERY)
  const wod = data?.wordOfDay

  return (
    <div className="bg-surface-raised border border-gold/20 rounded-xl p-5 shadow-[0_0_12px_rgba(201,168,76,0.05)]">
      <p className="text-[10px] uppercase tracking-widest text-gold font-medium mb-3">Word of the Day</p>
      {loading ? (
        <div className="space-y-2">
          <div className="animate-pulse h-8 w-40 bg-surface-card rounded" />
          <div className="animate-pulse h-3 w-16 bg-surface-card rounded" />
          <div className="animate-pulse h-4 w-full bg-surface-card rounded mt-1" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <p className="text-3xl font-bold font-display text-ink tracking-tight">{wod?.word}</p>
          <p className="text-xs italic text-ink-muted mt-1.5">{wod?.partOfSpeech}</p>
          <p className="text-sm text-ink-muted mt-2 leading-relaxed">{wod?.definition}</p>
        </motion.div>
      )}
    </div>
  )
}
