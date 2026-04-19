import { createContext, useContext, useState, ReactNode } from 'react'

export type PersonSlug = 'harry' | 'ruby' | 'krysten' | 'jon' | 'mylo'

interface PersonContextValue {
  activePerson: PersonSlug | null
  setActivePerson: (slug: PersonSlug | null) => void
}

const PersonContext = createContext<PersonContextValue>({
  activePerson: null,
  setActivePerson: () => {},
})

export function PersonProvider({ children }: { children: ReactNode }) {
  const [activePerson, setActivePersonState] = useState<PersonSlug | null>(() => {
    return (localStorage.getItem('fd-person') as PersonSlug) ?? null
  })

  function setActivePerson(slug: PersonSlug | null) {
    setActivePersonState(slug)
    if (slug) {
      localStorage.setItem('fd-person', slug)
    } else {
      localStorage.removeItem('fd-person')
    }
  }

  return (
    <PersonContext.Provider value={{ activePerson, setActivePerson }}>
      {children}
    </PersonContext.Provider>
  )
}

export function useActivePerson() {
  return useContext(PersonContext)
}
