import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const STUB_TRACK = { id: 't1', title: 'Golden Hour', artist: 'JVKE', url: '/music/golden-hour.mp3' }

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

async function getDailyTrack() {
  const today = todayKey()

  const existing = await prisma.track.findFirst({ where: { dateKey: today } })
  if (existing) {
    return { ...existing, url: `/music/${existing.filename}` }
  }

  let unpicked = await prisma.track.findMany({ where: { dateKey: null } })
  if (unpicked.length === 0) {
    await prisma.track.updateMany({ data: { dateKey: null } })
    unpicked = await prisma.track.findMany()
  }

  if (unpicked.length === 0) return null

  const pick = unpicked[Math.floor(Math.random() * unpicked.length)]
  const updated = await prisma.track.update({
    where: { id: pick.id },
    data: { dateKey: today },
  })

  return { ...updated, url: `/music/${updated.filename}` }
}

export async function forceRefreshDailyTrack(): Promise<void> {
  const today = todayKey()
  await prisma.track.updateMany({ where: { dateKey: today }, data: { dateKey: null } })
  await getDailyTrack()
  console.log('[tracks] Force-refreshed daily track for', today)
}

export const tracksResolvers = {
  Query: {
    dailyTrack: async () => {
      try {
        const track = await getDailyTrack()
        return track ?? STUB_TRACK
      } catch (err) {
        console.error('Daily track error, using stub:', err)
        return STUB_TRACK
      }
    },
  },
}
