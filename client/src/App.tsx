import { ApolloClient, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { HttpLink } from '@apollo/client/link/http'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import MusicBar from './components/MusicBar'
import TopBar from './components/TopBar'
import { AerialProvider } from './contexts/AerialContext'
import { PersonProvider } from './contexts/PersonContext'
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
      <MusicBar />
    </AerialProvider>
  )
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <PersonProvider>
          <AppShell />
        </PersonProvider>
      </BrowserRouter>
    </ApolloProvider>
  )
}
