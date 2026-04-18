import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const TRACK_QUERY = gql`
  query MusicShell {
    dailyTrack {
      title
      artist
    }
  }
`

export default function MusicShell() {
  const { data, loading } = useQuery(TRACK_QUERY)
  const track = data?.dailyTrack

  return (
    <div className="h-full bg-surface-raised border border-gold/20 rounded-xl shadow-[0_0_12px_rgba(201,168,76,0.05)] flex flex-col overflow-hidden">
      {/* Atmospheric artwork area */}
      <div
        className="flex-1 relative flex items-center justify-center min-h-0"
        style={{
          background:
            'linear-gradient(155deg, #0d1117 0%, #1a1a2e 30%, #162032 60%, #1c1008 100%)',
        }}
      >
        {/* Subtle diagonal stripe texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #C9A84C 0px, #C9A84C 1px, transparent 1px, transparent 24px)',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%)',
          }}
        />
        {/* Ghost play button */}
        <div className="relative z-10 w-16 h-16 rounded-full border border-gold/25 flex items-center justify-center">
          <div
            className="w-0 h-0 ml-1"
            style={{
              borderLeft: '18px solid rgba(201,168,76,0.35)',
              borderTop: '11px solid transparent',
              borderBottom: '11px solid transparent',
            }}
          />
        </div>
      </div>

      {/* Track info */}
      <div className="px-5 py-4 border-t border-gold/10">
        <p className="text-[10px] uppercase tracking-widest text-gold font-medium mb-1.5">Today's Song</p>
        {loading ? (
          <div className="space-y-1.5">
            <div className="animate-pulse h-5 w-36 bg-surface-card rounded" />
            <div className="animate-pulse h-3.5 w-20 bg-surface-card rounded" />
          </div>
        ) : (
          <>
            <p className="text-base font-bold font-display text-ink leading-tight">{track?.title}</p>
            <p className="text-xs text-ink-muted mt-0.5">{track?.artist}</p>
          </>
        )}
      </div>
    </div>
  )
}
