import PlaceholderCard from '../components/PlaceholderCard'

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-4 pt-6 md:p-6">
      {/*
        3-column grid on tablet/desktop, single column on mobile.
        Col 1 (wide): Calendar + Message
        Col 2 (wide): Weather + Word of the Day
        Col 3 (narrow): Music + Chores Summary
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 md:h-[calc(100vh-5rem)] md:max-h-[900px]">

        {/* Column 1 */}
        <div className="flex flex-col gap-4 md:gap-5">
          <PlaceholderCard label="Upcoming Events" className="flex-1 min-h-48" />
          <PlaceholderCard label="Message" className="min-h-32" />
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-4 md:gap-5">
          <PlaceholderCard label="Weather" className="flex-1 min-h-48" />
          <PlaceholderCard label="Word of the Day" className="min-h-36" />
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-4 md:gap-5">
          <PlaceholderCard label="Music" className="flex-1 min-h-48" />
          <PlaceholderCard label="Chores Summary" className="min-h-40" />
        </div>
      </div>
    </div>
  )
}
