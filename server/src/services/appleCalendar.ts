import { createDAVClient } from 'tsdav'
import ICAL from 'ical.js'
import { randomUUID } from 'crypto'
import { CalendarEvent } from './googleCalendar'

// Apple uses U+2019 RIGHT SINGLE QUOTATION MARK in "Jon's Calendar"
const JON_CAL = 'Jon’s Calendar'

const CALENDAR_COLORS: Record<string, string> = {
  [JON_CAL]:  '#C9A84C',
  'Untitled': '#7BC67E',
}

const CALENDAR_PERSON_SLUGS: Record<string, string> = {
  [JON_CAL]:  'jon',
  'Untitled': 'krysten',
}

// Invert: person slug → Apple calendar display name
const PERSON_CALENDAR_NAMES: Record<string, string> = {
  jon:     JON_CAL,
  krysten: 'Untitled',
}

const TARGET_CALENDARS = new Set([JON_CAL, 'Untitled'])

function calendarName(displayName: string | Record<string, unknown> | undefined): string | null {
  if (!displayName) return null
  if (typeof displayName === 'string') return displayName
  return null
}

export async function fetchAppleCalendarEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_PASSWORD) return []

  const client = await createDAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: {
      username: process.env.APPLE_ID,
      password: process.env.APPLE_APP_PASSWORD,
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
    const name = calendarName(calendar.displayName) ?? ''
    const color = CALENDAR_COLORS[name] ?? '#C9A84C'
    const personSlug = CALENDAR_PERSON_SLUGS[name] ?? 'jon'

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

        // Separate master events from recurrence exceptions (RECURRENCE-ID)
        const masters = new Map<string, ICAL.Component>()
        const exceptions = new Map<string, ICAL.Component[]>()
        for (const vevent of vevents) {
          const uid = vevent.getFirstPropertyValue('uid') as string
          if (vevent.getFirstProperty('recurrence-id')) {
            if (!exceptions.has(uid)) exceptions.set(uid, [])
            exceptions.get(uid)!.push(vevent)
          } else {
            masters.set(uid, vevent)
          }
        }

        // Exception VEVENTs (RECURRENCE-ID) already have the correct overridden date — filter by range then push
        for (const excList of exceptions.values()) {
          for (const exc of excList) {
            const ev = new ICAL.Event(exc)
            const evMs = ev.startDate.toJSDate().getTime()
            if (evMs < start.getTime() || evMs >= end.getTime()) continue
            const isAllDay = ev.startDate.isDate
            allEvents.push({
              id: `${ev.uid}_exc_${ev.startDate.toString()}`,
              title: ev.summary || '(No title)',
              start: isAllDay ? ev.startDate.toString() : ev.startDate.toJSDate().toISOString(),
              end: isAllDay ? ev.endDate.toString() : ev.endDate.toJSDate().toISOString(),
              allDay: isAllDay,
              description: ev.description || null,
              color,
              personSlug,
            })
          }
        }

        for (const [, master] of masters) {
          const event = new ICAL.Event(master)

          if (event.isRecurring()) {
            // Expand occurrences within [start, end]; iterate from the top since ICAL.Time
            // timezone handling makes passing a startTime unreliable.
            const iter = event.iterator()
            let next = iter.next()
            let count = 0
            while (next && count++ < 2000) {
              const nextMs = next.toJSDate().getTime()
              if (nextMs >= end.getTime()) break
              if (nextMs < start.getTime()) { next = iter.next(); continue }
              const details = event.getOccurrenceDetails(next)
              const isAllDay = details.startDate.isDate
              allEvents.push({
                id: `${event.uid}_${next.toString()}`,
                title: details.item.summary || '(No title)',
                start: isAllDay ? details.startDate.toString() : details.startDate.toJSDate().toISOString(),
                end: isAllDay ? details.endDate.toString() : details.endDate.toJSDate().toISOString(),
                allDay: isAllDay,
                description: details.item.description || null,
                color,
                personSlug,
              })
              next = iter.next()
            }
          } else {
            const isAllDay = event.startDate.isDate
            allEvents.push({
              id: event.uid,
              title: event.summary || '(No title)',
              start: isAllDay ? event.startDate.toString() : event.startDate.toJSDate().toISOString(),
              end: isAllDay ? event.endDate.toString() : event.endDate.toJSDate().toISOString(),
              allDay: isAllDay,
              description: event.description || null,
              color,
              personSlug,
            })
          }
        }
      } catch (e) {
        console.error('[apple calendar] Failed to parse event:', e)
      }
    }
  }

  return allEvents
}

function formatICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function buildICS(uid: string, title: string, start: Date, end: Date): string {
  const stamp = formatICSDate(new Date())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Family Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@family-dashboard`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${title}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function buildAllDayICS(uid: string, title: string, dateStr: string, description?: string): string {
  // dateStr is YYYY-MM-DD; DTEND is next day for all-day events per RFC 5545
  const [year, month, day] = dateStr.split('-').map(Number)
  const endDate = new Date(Date.UTC(year, month - 1, day + 1))
  const endStr = endDate.toISOString().slice(0, 10).replace(/-/g, '')
  const startStr = dateStr.replace(/-/g, '')
  const stamp = formatICSDate(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Family Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@family-dashboard`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${startStr}`,
    `DTEND;VALUE=DATE:${endStr}`,
    `SUMMARY:${title}`,
  ]
  if (description) lines.push(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export async function createAppleCalendarEvent(
  personSlug: string,
  eventTitle: string,
  start: Date,
  end: Date,
): Promise<string | null> {
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_PASSWORD) return null

  const targetName = PERSON_CALENDAR_NAMES[personSlug]
  if (!targetName) {
    console.warn(`[appleCalendar] No calendar mapped for person: ${personSlug}`)
    return null
  }

  try {
    const client = await createDAVClient({
      serverUrl: 'https://caldav.icloud.com',
      credentials: {
        username: process.env.APPLE_ID,
        password: process.env.APPLE_APP_PASSWORD,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    })

    const calendars = await client.fetchCalendars()
    const target = calendars.find(cal => calendarName(cal.displayName) === targetName)

    if (!target) {
      console.warn(`[appleCalendar] Calendar not found: "${targetName}"`)
      return null
    }

    const uid = randomUUID()
    await client.createCalendarObject({
      calendar: target,
      filename: `${uid}.ics`,
      iCalString: buildICS(uid, eventTitle, start, end),
    })

    console.log(`[appleCalendar] Created event "${eventTitle}" in ${targetName}`)
    return uid
  } catch (err) {
    console.error('[appleCalendar] Failed to create event:', err)
    return null
  }
}

export async function createAppleCalendarAllDayEvent(
  personSlug: string,
  eventTitle: string,
  date: string,
  description?: string,
): Promise<string | null> {
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_PASSWORD) return null

  const targetName = PERSON_CALENDAR_NAMES[personSlug]
  if (!targetName) {
    console.warn(`[appleCalendar] No calendar mapped for person: ${personSlug}`)
    return null
  }

  try {
    const client = await createDAVClient({
      serverUrl: 'https://caldav.icloud.com',
      credentials: {
        username: process.env.APPLE_ID,
        password: process.env.APPLE_APP_PASSWORD,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    })

    const calendars = await client.fetchCalendars()
    const target = calendars.find(cal => calendarName(cal.displayName) === targetName)

    if (!target) {
      console.warn(`[appleCalendar] Calendar not found: "${targetName}"`)
      return null
    }

    const uid = randomUUID()
    await client.createCalendarObject({
      calendar: target,
      filename: `${uid}.ics`,
      iCalString: buildAllDayICS(uid, eventTitle, date, description),
    })

    console.log(`[appleCalendar] Created all-day event "${eventTitle}" on ${date} in ${targetName}`)
    return uid
  } catch (err) {
    console.error('[appleCalendar] Failed to create all-day event:', err)
    return null
  }
}
