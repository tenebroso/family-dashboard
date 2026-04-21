import { google } from 'googleapis'

const GOOGLE_COLOR_MAP: Record<string, string> = {
  '1': '#7986CB',
  '2': '#33B679',
  '3': '#8E24AA',
  '4': '#E67C73',
  '5': '#F6BF26',
  '6': '#F4511E',
  '7': '#039BE5',
  '8': '#616161',
  '9': '#3F51B5',
  '10': '#0B8043',
  '11': '#D50000',
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  description: string | null
  color: string
  personSlug: string | null
}

// GOOGLE_CALENDAR_ID_KRYSTEN is the shared Family calendar (always visible to everyone)
const CALENDARS: { calendarId: string; personSlug: string | null }[] = [
  { calendarId: process.env.GOOGLE_CALENDAR_ID_JON,          personSlug: 'jon'     },
  { calendarId: process.env.GOOGLE_CALENDAR_ID_KRYSTEN,      personSlug: null      },
  { calendarId: process.env.GOOGLE_CALENDAR_ID_HARRY,        personSlug: 'harry'   },
  { calendarId: process.env.GOOGLE_CALENDAR_ID_HARRY_SOCCER, personSlug: 'harry'   },
  { calendarId: process.env.GOOGLE_CALENDAR_ID_RUBY,         personSlug: 'ruby'    },
  { calendarId: process.env.GOOGLE_CALENDAR_ID_RUBY_SOCCER,  personSlug: 'ruby'    },
  { calendarId: process.env.GOOGLE_CALENDAR_ID_MYLO,         personSlug: 'mylo'    },
].filter((c): c is { calendarId: string; personSlug: string | null } => Boolean(c.calendarId))

type CacheEntry = { data: CalendarEvent[]; expires: number }
const cache = new Map<string, CacheEntry>()

function createCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

const FAMILY_COLOR = '#9A9488'

async function fetchCalendarForPerson(
  calendarId: string,
  personSlug: string | null,
  start: Date,
  end: Date,
): Promise<CalendarEvent[]> {
  const cacheKey = `${calendarId}::${start.toISOString()}::${end.toISOString()}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) return cached.data

  const calendar = createCalendarClient()
  const response = await calendar.events.list({
    calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  })

  const items = response.data.items ?? []
  const events = items.map(event => {
    const isAllDay = !event.start?.dateTime
    const startStr = isAllDay ? event.start!.date! : event.start!.dateTime!
    const endStr = isAllDay ? event.end!.date! : event.end!.dateTime!
    const defaultColor = personSlug === null ? FAMILY_COLOR : '#C9A84C'
    const color = event.colorId ? (GOOGLE_COLOR_MAP[event.colorId] ?? defaultColor) : defaultColor
    return {
      id: event.id ?? `evt-${Date.now()}`,
      title: event.summary ?? '(No title)',
      start: startStr,
      end: endStr,
      allDay: isAllDay,
      description: event.description ?? null,
      color,
      personSlug,
    }
  })

  cache.set(cacheKey, { data: events, expires: Date.now() + 15 * 60 * 1000 })
  setTimeout(() => cache.delete(cacheKey), 15 * 60 * 1000)
  return events
}

export async function fetchCalendarEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  if (CALENDARS.length === 0) return []

  const results = await Promise.allSettled(
    CALENDARS.map(c => fetchCalendarForPerson(c.calendarId, c.personSlug, start, end)),
  )

  const events: CalendarEvent[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') events.push(...result.value)
    else console.error('[google calendar] Failed to fetch calendar:', result.reason)
  }
  return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}
