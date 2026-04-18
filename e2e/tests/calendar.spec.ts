import { test, expect } from '@playwright/test'

test.describe('Calendar', () => {
  test('calendar page loads in month view', async ({ page }) => {
    await page.goto('/calendar')

    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Day' })).toBeVisible()

    await expect(page.getByTestId('today-cell')).toBeVisible()
  })

  test('switching to week view', async ({ page }) => {
    await page.goto('/calendar')

    await page.getByRole('button', { name: 'Week' }).click()

    await expect(page.getByTestId('calendar-week-view')).toBeVisible()
  })

  test('switching to day view', async ({ page }) => {
    await page.goto('/calendar')

    await page.getByRole('button', { name: 'Day' }).click()

    await expect(page.getByTestId('calendar-day-view')).toBeVisible()
  })

  test('tapping a day with events opens detail panel', async ({ page }) => {
    await page.goto('/calendar')

    // Wait for events to load and find first event chip in a day cell
    const chip = page.getByTestId('event-chip').first()
    await expect(chip).toBeVisible({ timeout: 8000 })

    // Click the event chip directly to open event detail
    await chip.click()

    await expect(page.getByTestId('event-detail')).toBeVisible()

    // Close via the close button
    await page.getByTestId('event-detail').getByRole('button').filter({ has: page.locator('svg') }).click()
    await expect(page.getByTestId('event-detail')).not.toBeVisible({ timeout: 2000 })
  })
})
