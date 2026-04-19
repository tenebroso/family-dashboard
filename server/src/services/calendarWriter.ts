import { google } from 'googleapis'
import * as chrono from 'chrono-node'

const PERSON_CALENDAR_IDS: Record<string, string | undefined> = {
  jon:     process.env.GOOGLE_CALENDAR_ID_JON,
  krysten: process.env.GOOGLE_CALENDAR_ID_KRYSTEN,
  harry:   process.env.GOOGLE_CALENDAR_ID_HARRY,
  ruby:    process.env.GOOGLE_CALENDAR_ID_RUBY,
  mylo:    process.env.GOOGLE_CALENDAR_ID_MYLO,
}

function createCalendarClient() {
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
  const calendarId = PERSON_CALENDAR_IDS[personSlug]
  if (!calendarId) {
    console.warn(`[calendarWriter] No calendar ID for person: ${personSlug}`)
    return null
  }

  const parsed = chrono.parseDate(dateText, new Date(), { forwardDate: true })
  if (!parsed) {
    console.warn(`[calendarWriter] Could not parse date: "${dateText}"`)
    return null
  }

  const startTime = parsed
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // default 1hr

  try {
    const calendar = createCalendarClient()
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
    console.error('[calendarWriter] Failed to create event:', err)
    return null
  }
}
