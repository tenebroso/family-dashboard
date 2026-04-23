import { chromium } from '@playwright/test'

const browser = await chromium.launch()

const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 800 })
await page.goto('http://localhost:5173/calendar')
await page.waitForSelector('[data-testid="event-chip"]', { timeout: 8000 })
await page.screenshot({ path: 'cal-desktop-month.png' })

await page.locator('[data-testid="event-chip"]').first().click()
await page.waitForSelector('[data-testid="event-detail"]')
await page.screenshot({ path: 'cal-desktop-detail.png' })
await page.locator('[data-testid="event-detail"] button').click()
await page.waitForTimeout(500)

await page.getByRole('button', { name: 'Week' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: 'cal-desktop-week.png' })

await page.getByRole('button', { name: 'Day' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: 'cal-desktop-day.png' })

const mob = await browser.newPage()
await mob.setViewportSize({ width: 390, height: 844 })
await mob.goto('http://localhost:5173/calendar')
await mob.waitForTimeout(2000)
await mob.screenshot({ path: 'cal-mobile-month.png' })

const ipad = await browser.newPage()
await ipad.setViewportSize({ width: 768, height: 1024 })
await ipad.goto('http://localhost:5173/calendar')
await ipad.waitForSelector('[data-testid="event-chip"]', { timeout: 8000 })
await ipad.screenshot({ path: 'cal-ipad-month.png' })

await browser.close()
console.log('done')
