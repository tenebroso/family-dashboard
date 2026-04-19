import WeatherWidget from '../components/WeatherWidget'
import CalendarShell from '../components/CalendarShell'
import WordShell from '../components/WordShell'
import MusicShell from '../components/MusicShell'
import MessageShell from '../components/MessageShell'
import ChoresSummaryShell from '../components/ChoresSummaryShell'

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-4 pt-6 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 md:h-[calc(100vh-5rem)] md:max-h-[900px]">

        {/* Column 1: Calendar + Message */}
        <div className="flex flex-col gap-4 md:gap-5 min-h-0">
          <div className="flex-1 min-h-0">
            <CalendarShell />
          </div>
          <MessageShell />
        </div>

        {/* Column 2: Weather + Word of the Day */}
        <div className="flex flex-col gap-4 md:gap-5 min-h-0">
          <div className="flex-1 min-h-0">
            <WeatherWidget />
          </div>
          <WordShell />
        </div>

        {/* Column 3: Music + Chores Summary */}
        <div className="flex flex-col gap-4 md:gap-5 min-h-0">
          <div className="flex-1 min-h-0">
            <MusicShell />
          </div>
          <ChoresSummaryShell />
        </div>

      </div>
    </div>
  )
}
