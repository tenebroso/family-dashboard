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

export default function MusicBar() {
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
    const onEnded = () => { setPlaying(false); setProgress(0) }
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

  if (!loading && !track) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-13" style={{ height: '52px', background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {track && (
        <audio
          ref={audioRef}
          src={`http://localhost:4000${track.url}`}
          preload="metadata"
        />
      )}

      {/* Progress line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-surface-card">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, background: 'rgba(201,168,76,0.6)' }}
        />
      </div>

      <div className="flex items-center h-full px-4 gap-3">
        {/* Play/pause button */}
        <button
          onClick={togglePlay}
          disabled={loading || !track}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-40 flex-shrink-0"
          style={{ border: '1px solid rgba(201,168,76,0.3)' }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <div className="flex gap-[3px]">
              <div className="w-[3px] h-[12px] rounded-sm" style={{ background: 'rgba(201,168,76,0.8)' }} />
              <div className="w-[3px] h-[12px] rounded-sm" style={{ background: 'rgba(201,168,76,0.8)' }} />
            </div>
          ) : (
            <div
              className="ml-[2px]"
              style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid rgba(201,168,76,0.8)',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
              }}
            />
          )}
        </button>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="animate-pulse h-3 w-32 bg-surface-card rounded" />
          ) : (
            <p className="text-xs text-ink-muted truncate">
              <span className="text-ink font-medium">{track?.title}</span>
              <span className="mx-1.5 text-ink-muted/50">·</span>
              <span>{track?.artist}</span>
            </p>
          )}
        </div>

        {/* Label */}
        <p className="text-[9px] uppercase tracking-widest flex-shrink-0" style={{ color: 'rgba(201,168,76,0.5)' }}>
          Today's Song
        </p>
      </div>
    </div>
  )
}
