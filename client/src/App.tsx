import { ApolloClient, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { HttpLink } from '@apollo/client/link/http'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import DashboardPage from './pages/DashboardPage'
import ChoresPage from './pages/ChoresPage'
import CalendarPage from './pages/CalendarPage'
import MessageAdminPage from './pages/MessageAdminPage'

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
  cache: new InMemoryCache(),
})

export default function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <NavBar />
        <main className="pt-14">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chores" element={<ChoresPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/message-admin" element={<MessageAdminPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </ApolloProvider>
  )
}
