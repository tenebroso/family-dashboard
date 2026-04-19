import { fetchCalendarEvents } from '../services/googleCalendar'
import { fetchAppleCalendarEvents } from '../services/appleCalendar'

const now = new Date()
const day = (offset: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

export const STUB_CALENDAR_EVENTS = [
  { id: 'e1', title: 'Soccer practice', start: day(1), end: day(1), allDay: false, description: null, color: '#4A90D9' },
  { id: 'e2', title: 'Dentist - Ruby', start: day(3), end: day(3), allDay: false, description: null, color: '#E8607A' },
  { id: 'e3', title: 'Family dinner', start: day(5), end: day(5), allDay: true, description: "At Grandma's", color: '#C9A84C' },
  { id: 'e4', title: 'Grocery run', start: day(8), end: day(8), allDay: false, description: null, color: '#7BC67E' },
  { id: 'e5', title: "Harry's birthday", start: day(12), end: day(12), allDay: true, description: null, color: '#4A90D9' },
]

type CacheEntry = { data: unknown; expires: number }
const cache = new Map<string, CacheEntry>()

export const calendarResolvers = {
  Query: {
    calendarEvents: async (_: unknown, args: { start: string; end: string }) => {
      const key = `${args.start}::${args.end}`
      const cached = cache.get(key)
      if (cached && cached.expires > Date.now()) return cached.data

      try {
        const [googleResult, appleResult] = await Promise.allSettled([
          fetchCalendarEvents(new Date(args.start), new Date(args.end)),
          fetchAppleCalendarEvents(new Date(args.start), new Date(args.end)),
        ])

        if (googleResult.status === 'rejected')
          console.error('[calendar] Google API error:', googleResult.reason)
        if (appleResult.status === 'rejected')
          console.error('[calendar] Apple CalDAV error:', appleResult.reason)

        const events = [
          ...(googleResult.status === 'fulfilled' ? googleResult.value : []),
          ...(appleResult.status === 'fulfilled' ? appleResult.value : []),
        ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

        if (events.length === 0 && googleResult.status === 'rejected' && appleResult.status === 'rejected') {
          throw new Error('Both calendar sources failed')
        }

        const entry: CacheEntry = { data: events, expires: Date.now() + 15 * 60 * 1000 }
        cache.set(key, entry)
        setTimeout(() => cache.delete(key), 15 * 60 * 1000)
        return events
      } catch (err) {
        console.error('[calendar] All sources failed, falling back to stubs:', err)
        const startMs = new Date(args.start).getTime()
        const endMs = new Date(args.end).getTime()
        return STUB_CALENDAR_EVENTS.filter(evt => {
          const t = new Date(evt.start).getTime()
          return t >= startMs && t <= endMs
        })
      }
    },
  },
}
