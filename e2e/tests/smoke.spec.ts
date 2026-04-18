import { test, expect } from '@playwright/test'

test('dashboard loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('HOME')).toBeVisible()
})

test('navigation links present', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Chores' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible()
})

test('server ping', async ({ request }) => {
  const response = await request.post('http://localhost:4000/graphql', {
    data: { query: '{ ping }' },
  })
  const json = await response.json()
  expect(json.data.ping).toBe('pong')
})
