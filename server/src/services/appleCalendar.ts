import { createDAVClient } from 'tsdav'
import ICAL from 'ical.js'
import { CalendarEvent } from './googleCalendar'

const CALENDAR_COLORS: Record<string, string> = {
  "Jon's Calendar": '#C9A84C',
  'Untitled': '#7BC67E',
}

const TARGET_CALENDARS = new Set(["Jon's Calendar", 'Untitled'])

function calendarName(displayName: string | Record<string, unknown> | undefined): string | null {
  if (!displayName) return null
  if (typeof displayName === 'string') return displayName
  return null
}

export async function fetchAppleCalendarEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  const client = await createDAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: {
      username: process.env.APPLE_ID!,
      password: process.env.APPLE_APP_PASSWORD!,
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })

  const calendars = await client.fetchCalendars()
  const targetCals = calendars.filter(cal => {
    const name = calendarName(cal.displayName)
    return name && TARGET_CALENDARS.has(name)
  })

  const allEvents: CalendarEvent[] = []

  for (const calendar of targetCals) {
    const color = CALENDAR_COLORS[calendarName(calendar.displayName) ?? ''] ?? '#C9A84C'

    const objects = await client.fetchCalendarObjects({
      calendar,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    })

    for (const obj of objects) {
      if (!obj.data) continue
      try {
        const jcal = ICAL.parse(obj.data)
        const comp = new ICAL.Component(jcal)
        const vevents = comp.getAllSubcomponents('vevent')

        for (const vevent of vevents) {
          const event = new ICAL.Event(vevent)
          const isAllDay = event.startDate.isDate

          allEvents.push({
            id: event.uid,
            title: event.summary || '(No title)',
            start: isAllDay
              ? event.startDate.toString()
              : event.startDate.toJSDate().toISOString(),
            end: isAllDay
              ? event.endDate.toString()
              : event.endDate.toJSDate().toISOString(),
            allDay: isAllDay,
            description: event.description || null,
            color,
          })
        }
      } catch (e) {
        console.error('[apple calendar] Failed to parse event:', e)
      }
    }
  }

  return allEvents
}
