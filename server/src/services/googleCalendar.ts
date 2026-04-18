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
}

function createCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function fetchCalendarEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID not set')

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
  return items.map(event => {
    const isAllDay = !event.start?.dateTime
    const startStr = isAllDay ? event.start!.date! : event.start!.dateTime!
    const endStr = isAllDay ? event.end!.date! : event.end!.dateTime!
    const color = event.colorId ? (GOOGLE_COLOR_MAP[event.colorId] ?? '#C9A84C') : '#C9A84C'

    return {
      id: event.id ?? `evt-${Date.now()}`,
      title: event.summary ?? '(No title)',
      start: startStr,
      end: endStr,
      allDay: isAllDay,
      description: event.description ?? null,
      color,
    }
  })
}
