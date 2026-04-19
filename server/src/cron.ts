import cron from 'node-cron'
import { forceRefreshAerial } from './services/aerial'
import { forceRefreshWordOfDay } from './services/wordOfDay'
import { forceRefreshDailyTrack } from './resolvers/tracks'

export function startCronJobs() {
  // Refresh background photo, word of the day, and song at 5:00am Central every day
  cron.schedule('0 5 * * *', async () => {
    console.log('[cron] Daily 5am refresh: background + word + song')
    await Promise.all([forceRefreshAerial(), forceRefreshWordOfDay(), forceRefreshDailyTrack()])
  }, { timezone: 'America/Chicago' })
}
