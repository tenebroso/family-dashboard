import CalendarWeekWidget from '../components/CalendarWeekWidget'
import WordWidget from '../components/WordWidget'
import MessageWidget from '../components/MessageWidget'
import ChoresSummaryShell from '../components/ChoresSummaryShell'
import GroceryWidget from '../components/GroceryWidget'
import RemindersWidget from '../components/RemindersWidget'
import { useAerial } from '../contexts/AerialContext'

export default function DashboardPage() {
  const aerial = useAerial()

  return (
    <div
      className="min-h-screen p-3 pt-4 md:p-4 space-y-3"
      style={aerial ? {
        backgroundImage: "url('/api/aerial')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : undefined}
    >
      {/* Full-width week calendar */}
      <CalendarWeekWidget />

      {/* Row 2: Chores · Grocery · Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <ChoresSummaryShell />
        <GroceryWidget />
        <RemindersWidget />
      </div>

      {/* Row 3: Word of Day (1 col) · Message (2 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <WordWidget />
        <div className="md:col-span-2">
          <MessageWidget />
        </div>
      </div>
    </div>
  )
}
