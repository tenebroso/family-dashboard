import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { motion } from 'framer-motion'
import Skeleton from './Skeleton'
import { useCardClass } from '../hooks/useCardClass'

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
  const { data, loading } = useQuery<{ wordOfDay: { word: string; partOfSpeech: string; definition: string } }>(WORD_QUERY)
  const wod = data?.wordOfDay
  const cardClass = useCardClass('tile p-4')

  return (
    <div className={cardClass}>
      <p className="text-[10px] uppercase tracking-widest text-gold font-medium mb-2 tile-eyebrow">Word of the Day</p>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full mt-1" />
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
