import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface AuthPerson {
  id: string
  name: string
  color: string
}

type AuthStatus = 'loading' | 'unauthenticated' | 'unlinked' | 'authenticated'

interface AuthContextValue {
  status: AuthStatus
  person: AuthPerson | null
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  person: null,
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [person, setPerson] = useState<AuthPerson | null>(null)

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) {
          setStatus('unauthenticated')
        } else if (res.status === 403) {
          setStatus('unlinked')
        } else if (res.ok) {
          const data = await res.json()
          setPerson(data.person)
          setStatus('authenticated')
        } else {
          setStatus('unauthenticated')
        }
      })
      .catch(() => setStatus('unauthenticated'))
  }, [])

  function logout() {
    window.location.href = '/auth/logout'
  }

  return (
    <AuthContext.Provider value={{ status, person, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
