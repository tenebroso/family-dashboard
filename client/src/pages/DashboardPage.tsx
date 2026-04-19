import WeatherWidget from '../components/WeatherWidget'
import CalendarShell from '../components/CalendarShell'
import WordWidget from '../components/WordWidget'
import MessageWidget from '../components/MessageWidget'
import ChoresSummaryShell from '../components/ChoresSummaryShell'
import { useAerial } from '../contexts/AerialContext'

export default function DashboardPage() {
  const aerial = useAerial()

  return (
    <div
      className="min-h-screen p-3 pt-4 md:p-4"
      style={aerial ? {
        backgroundImage: "url('/api/aerial')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : undefined}
    >
      <MessageWidget />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 items-start">

        {/* Column 1: Calendar */}
        <CalendarShell />

        {/* Column 2: Weather */}
        <WeatherWidget />

        {/* Column 3: Chores + Word of Day */}
        <div className="flex flex-col gap-3">
          <ChoresSummaryShell />
          <WordWidget />
        </div>

      </div>
    </div>
  )
}
