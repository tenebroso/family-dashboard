import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const AerialContext = createContext(false)

export function AerialProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    fetch('/api/aerial', { method: 'HEAD' })
      .then((res) => { if (res.ok) setActive(true) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--aerial-active', active ? '1' : '0')
  }, [active])

  return <AerialContext.Provider value={active}>{children}</AerialContext.Provider>
}

export function useAerial() {
  return useContext(AerialContext)
}
