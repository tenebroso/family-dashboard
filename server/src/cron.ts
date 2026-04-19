import cron from 'node-cron'
import { ensureTodaysAerial } from './services/aerial'

export function startCronJobs() {
  // Pre-fetch the next day's aerial image at 00:05 daily
  cron.schedule('5 0 * * *', async () => {
    console.log('[cron] Refreshing aerial background for new day')
    await ensureTodaysAerial()
  })
}
