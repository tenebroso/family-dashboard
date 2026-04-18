import { test, expect } from '@playwright/test'

test('chores page loads with all four people', async ({ page }) => {
  await page.goto('/chores')
  // Use first() to avoid strict mode when a name appears in both summary row and card header
  await expect(page.getByText('Harry').first()).toBeVisible()
  await expect(page.getByText('Ruby').first()).toBeVisible()
  await expect(page.getByText('Krysten').first()).toBeVisible()
  await expect(page.getByText('Jon').first()).toBeVisible()
})

test('completing a chore updates the UI', async ({ page }) => {
  await page.goto('/chores')
  // Wait for chore buttons specifically (not the nav hamburger)
  await page.waitForSelector('button[aria-label*="not completed"]', { timeout: 10000 })

  const firstUnchecked = page.locator('button[aria-label*="not completed"]').first()
  const label = await firstUnchecked.getAttribute('aria-label') ?? ''
  await firstUnchecked.click()

  const choreTitle = label.replace(' – not completed', '')
  await expect(page.locator(`button[aria-label="${choreTitle} – completed"]`).first()).toBeVisible()
})

test('unchecking a completed chore reverts it', async ({ page }) => {
  await page.goto('/chores')
  await page.waitForSelector('button[aria-label*="not completed"]', { timeout: 10000 })

  const firstUnchecked = page.locator('button[aria-label*="not completed"]').first()
  const label = await firstUnchecked.getAttribute('aria-label') ?? ''
  const choreTitle = label.replace(' – not completed', '')
  await firstUnchecked.click()

  const completed = page.locator(`button[aria-label="${choreTitle} – completed"]`).first()
  await expect(completed).toBeVisible()
  await completed.click()

  await expect(page.locator(`button[aria-label="${choreTitle} – not completed"]`).first()).toBeVisible()
})

test('chores admin - add a chore', async ({ page }) => {
  await page.goto('/chores-admin')
  await page.getByRole('button', { name: 'Add Chore' }).click()

  await page.getByPlaceholder('Chore title').fill('Test Chore Playwright')
  await page.getByRole('combobox').selectOption({ label: 'Harry' })
  await page.getByRole('button', { name: 'Mon' }).click()
  await page.getByRole('button', { name: 'Add Chore' }).last().click()

  await expect(page.getByText('Test Chore Playwright')).toBeVisible()
})

test('chores admin - delete a chore', async ({ page }) => {
  await page.goto('/chores-admin')
  await page.waitForSelector('text=Test Chore Playwright', { timeout: 5000 }).catch(() => null)

  const choreText = page.getByText('Test Chore Playwright')
  if (await choreText.isVisible()) {
    const row = page.locator('div').filter({ hasText: 'Test Chore Playwright' }).last()
    await row.hover()
    page.once('dialog', d => d.accept())
    await row.getByRole('button', { name: 'Delete' }).click()
    await expect(choreText).not.toBeVisible()
  }
})
