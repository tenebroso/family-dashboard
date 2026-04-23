import { google } from 'googleapis'
import * as chrono from 'chrono-node'
import { createAppleCalendarEvent } from './appleCalendar'

// jon and krysten write to Apple Calendar
const APPLE_CALENDAR_PEOPLE = new Set(['jon', 'krysten'])

// harry, ruby, mylo write to Google Calendar (if IDs are configured)
const GOOGLE_CALENDAR_IDS: Record<string, string | undefined> = {
  harry: process.env.GOOGLE_CALENDAR_ID_HARRY,
  ruby:  process.env.GOOGLE_CALENDAR_ID_RUBY,
  mylo:  process.env.GOOGLE_CALENDAR_ID_MYLO,
}

function createGoogleCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function createCalendarEvent(
  personSlug: string,
  eventTitle: string,
  dateText: string,
): Promise<string | null> {
  const parsed = chrono.parseDate(dateText, new Date(), { forwardDate: true })
  if (!parsed) {
    console.warn(`[calendarWriter] Could not parse date: "${dateText}"`)
    return null
  }

  const startTime = parsed
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

  if (APPLE_CALENDAR_PEOPLE.has(personSlug)) {
    return createAppleCalendarEvent(personSlug, eventTitle, startTime, endTime)
  }

  const calendarId = GOOGLE_CALENDAR_IDS[personSlug]
  if (!calendarId) {
    console.warn(`[calendarWriter] No calendar ID configured for person: ${personSlug}`)
    return null
  }

  try {
    const calendar = createGoogleCalendarClient()
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: eventTitle,
        start: { dateTime: startTime.toISOString() },
        end:   { dateTime: endTime.toISOString() },
      },
    })
    return response.data.id ?? null
  } catch (err) {
    console.error('[calendarWriter] Google Calendar write failed:', err)
    return null
  }
}
