import { useRef, useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const TRACK_QUERY = gql`
  query DailyTrack {
    dailyTrack {
      id
      title
      artist
      url
    }
  }
`

const GRADIENTS = [
  'linear-gradient(155deg, #0d1117 0%, #1a1a2e 35%, #162032 65%, #1c1008 100%)',
  'linear-gradient(155deg, #0f0c17 0%, #1e1030 35%, #0d1a1a 65%, #1a100a 100%)',
  'linear-gradient(155deg, #111008 0%, #1c1a06 35%, #0d1710 65%, #0c0d1a 100%)',
  'linear-gradient(155deg, #0a0f14 0%, #0d2020 35%, #1a1508 65%, #1a0a0a 100%)',
  'linear-gradient(155deg, #14080d 0%, #1a0a1a 35%, #0a1418 65%, #181408 100%)',
]

function gradientForTitle(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

export default function MusicWidget() {
  const { data, loading } = useQuery(TRACK_QUERY)
  const track = data?.dailyTrack

  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [track])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio || !track) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  const gradient = track ? gradientForTitle(track.title) : GRADIENTS[0]

  return (
    <div className="h-full bg-surface-raised border border-gold/20 rounded-xl shadow-[0_0_12px_rgba(201,168,76,0.05)] flex flex-col overflow-hidden">
      {track && (
        <audio
          ref={audioRef}
          src={`http://localhost:4000${track.url}`}
          preload="metadata"
        />
      )}

      {/* Artwork area */}
      <div
        className="flex-1 relative flex items-center justify-center min-h-0"
        style={{ background: gradient }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #C9A84C 0px, #C9A84C 1px, transparent 1px, transparent 24px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          disabled={loading || !track}
          className="relative z-10 w-16 h-16 min-w-[64px] min-h-[64px] rounded-full border border-gold/40 flex items-center justify-center hover:border-gold/70 hover:bg-gold/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <div className="flex gap-[5px]">
              <div className="w-[4px] h-[18px] bg-gold/70 rounded-sm" />
              <div className="w-[4px] h-[18px] bg-gold/70 rounded-sm" />
            </div>
          ) : (
            <div
              className="ml-1 w-0 h-0"
              style={{
                borderLeft: '18px solid rgba(201,168,76,0.7)',
                borderTop: '11px solid transparent',
                borderBottom: '11px solid transparent',
              }}
            />
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-surface-card">
        <div
          className="h-full bg-gold/50 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Track info */}
      <div className="px-5 py-4">
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
