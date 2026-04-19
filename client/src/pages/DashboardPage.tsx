import WeatherWidget from '../components/WeatherWidget'
import CalendarShell from '../components/CalendarShell'
import WordWidget from '../components/WordWidget'
import MessageWidget from '../components/MessageWidget'
import ChoresSummaryShell from '../components/ChoresSummaryShell'

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-3 pt-4 md:p-4">
      <MessageWidget />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">

        {/* Column 1: Calendar */}
        <div className="flex flex-col">
          <CalendarShell />
        </div>

        {/* Column 2: Weather */}
        <div className="flex flex-col">
          <WeatherWidget />
        </div>

        {/* Column 3: Word of Day + Chores */}
        <div className="flex flex-col gap-3">
          <WordWidget />
          <ChoresSummaryShell />
        </div>

      </div>
    </div>
  )
}
