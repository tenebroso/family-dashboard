import { ApolloClient, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { HttpLink } from '@apollo/client/link/http'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import TopBar from './components/TopBar'
import { AerialProvider } from './contexts/AerialContext'
import { PersonProvider, useActivePerson, type PersonSlug } from './contexts/PersonContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { usePageMeta } from './hooks/usePageMeta'
import LoginPage from './pages/LoginPage'
import LinkAccountPage from './pages/LinkAccountPage'
import LobbyPage from './pages/LobbyPage'
import DashboardPage from './pages/DashboardPage'
import ChoresPage from './pages/ChoresPage'
import CalendarPage from './pages/CalendarPage'
import ChoresAdminPage from './pages/ChoresAdminPage'
import GroceryAdminPage from './pages/GroceryAdminPage'
import RemindersPage from './pages/RemindersPage'
import MessageAdminPage from './pages/MessageAdminPage'
import WorkoutPage from './pages/WorkoutPage'
import { WorkoutApp } from './workout/WorkoutApp'

const graphqlUri = import.meta.env.PROD ? '/graphql' : 'http://localhost:4000/graphql'

const PERSON_META: Record<string, { title: string; icon: string; manifest: string }> = {
  jon:     { title: "Jon's Dashboard",     icon: '/icons/icon-jon.svg',     manifest: '/manifests/jon.webmanifest'     },
  krysten: { title: "Krysten's Dashboard", icon: '/icons/icon-krysten.svg', manifest: '/manifests/krysten.webmanifest' },
  harry:   { title: "Harry's Dashboard",   icon: '/icons/icon-harry.svg',   manifest: '/manifests/harry.webmanifest'   },
  mylo:    { title: "Mylo's Dashboard",    icon: '/icons/icon-mylo.svg',    manifest: '/manifests/mylo.webmanifest'    },
  ruby:    { title: "Ruby's Dashboard",    icon: '/icons/icon-ruby.svg',    manifest: '/manifests/ruby.webmanifest'    },
}
const WORKOUT_META = { title: 'Workout Tracker', icon: '/icons/icon-workout.svg', manifest: '/manifests/workout.webmanifest' }
const DEFAULT_META = { title: 'Family Dashboard', icon: '/icons/icon-default.svg', manifest: '/manifest.webmanifest' }

const client = new ApolloClient({
  link: new HttpLink({ uri: graphqlUri }),
  cache: new InMemoryCache(),
})

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { status, person } = useAuth()
  const { setActivePerson } = useActivePerson()

  const isWorkout = location.pathname.startsWith('/workout')
  const isDashboard = !isWorkout && location.pathname.match(/^\/[a-z]+(\/.*)?$/) !== null

  const firstSegment = location.pathname.split('/').filter(Boolean)[0]
  const pageMeta = isWorkout ? WORKOUT_META : (PERSON_META[firstSegment] ?? DEFAULT_META)
  usePageMeta(pageMeta.title, pageMeta.icon, pageMeta.manifest)

  // Sync auth person into PersonContext and auto-redirect from lobby
  useEffect(() => {
    if (status === 'authenticated' && person) {
      const slug = person.name.toLowerCase() as PersonSlug
      setActivePerson(slug)
      if (location.pathname === '/') {
        navigate(`/${slug}`, { replace: true })
      }
    }
  }, [status, person]) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') return <div className="lobby" />
  if (status === 'unauthenticated') return <LoginPage />
  if (status === 'unlinked') return <LinkAccountPage />

  return (
    <AerialProvider>
      <div className={isDashboard ? 'app' : undefined}>
        {isDashboard && <TopBar />}
        <main className={!isDashboard && !isWorkout ? 'pb-14' : undefined}>
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/:personSlug" element={<DashboardPage />} />
            <Route path="/:personSlug/chores" element={<ChoresPage />} />
            <Route path="/:personSlug/calendar" element={<CalendarPage />} />
            <Route path="/:personSlug/chores-admin" element={<ChoresAdminPage />} />
            <Route path="/:personSlug/grocery-admin" element={<GroceryAdminPage />} />
            <Route path="/:personSlug/reminders" element={<RemindersPage />} />
            <Route path="/grocery-admin" element={<GroceryAdminPage />} />
            <Route path="/message-admin" element={<MessageAdminPage />} />
            <Route path="/:personSlug/message-admin" element={<MessageAdminPage />} />
            <Route path="/:personSlug/workouts" element={<WorkoutPage />} />
            <Route path="/workout/*" element={<WorkoutApp />} />
          </Routes>
        </main>
      </div>
      {/* <MusicBar /> */}
    </AerialProvider>
  )
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <PersonProvider>
            <AppShell />
          </PersonProvider>
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  )
}
