import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import HeroTile from '../components/HeroTile'
import WeatherWidget from '../components/WeatherWidget'
import MessageWidget from '../components/MessageWidget'

import CalendarWeekWidget from '../components/CalendarWeekWidget'
import GroceryWidget from '../components/GroceryWidget'
import { useActivePerson } from '../contexts/PersonContext'
import type { PersonSlug } from '../contexts/PersonContext'

export default function DashboardPage() {
  const { personSlug } = useParams<{ personSlug: string }>()
  const { setActivePerson } = useActivePerson()

  useEffect(() => {
    if (personSlug) setActivePerson(personSlug as PersonSlug)
  }, [personSlug])

  return (
    <div className="dash-grid">
      <div className="dash-hero">
        <HeroTile />
      </div>

      <div className="dash-side">
        <WeatherWidget />
        <MessageWidget />
      </div>

      <div className="dash-week">
        <CalendarWeekWidget />
      </div>

      <div className="dash-below">
        <GroceryWidget />
      </div>
    </div>
  )
}
