import { useState, useEffect } from 'react'

export type TOD = 'morning' | 'afternoon' | 'evening'

function getTOD(hour: number): TOD {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function applyAccent(tod: TOD) {
  const accents: Record<TOD, { l: string; c: string; h: string }> = {
    morning:   { l: '0.70', c: '0.14', h: '55'  },
    afternoon: { l: '0.68', c: '0.10', h: '145' },
    evening:   { l: '0.65', c: '0.11', h: '320' },
  }
  const { l, c, h } = accents[tod]
  const root = document.documentElement
  root.style.setProperty('--accent', `oklch(${l} ${c} ${h})`)
  root.style.setProperty('--accent-ink', `oklch(0.35 ${c} ${h})`)
  root.style.setProperty('--accent-wash', `oklch(0.96 0.04 ${h})`)
  root.style.setProperty('--accent-wash-2', `oklch(0.91 0.07 ${h})`)
}

export function useTimeOfDay(): TOD {
  const [tod, setTOD] = useState<TOD>(() => getTOD(new Date().getHours()))

  useEffect(() => {
    applyAccent(tod)
  }, [tod])

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getTOD(new Date().getHours())
      setTOD(prev => {
        if (prev !== next) return next
        return prev
      })
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  return tod
}
