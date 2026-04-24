import { ApolloClient, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { HttpLink } from '@apollo/client/link/http'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import TopBar from './components/TopBar'
import { AerialProvider } from './contexts/AerialContext'
import { PersonProvider, useActivePerson, type PersonSlug } from './contexts/PersonContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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

const graphqlUri = import.meta.env.PROD ? '/graphql' : 'http://localhost:4000/graphql'

const client = new ApolloClient({
  link: new HttpLink({ uri: graphqlUri }),
  cache: new InMemoryCache(),
})

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { status, person } = useAuth()
  const { setActivePerson } = useActivePerson()

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

  const isDashboard = location.pathname.match(/^\/[a-z]+(\/.*)?$/) !== null

  return (
    <AerialProvider>
      <div className={isDashboard ? 'app' : undefined}>
        {isDashboard && <TopBar />}
        <main className={isDashboard ? undefined : 'pb-14'}>
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
