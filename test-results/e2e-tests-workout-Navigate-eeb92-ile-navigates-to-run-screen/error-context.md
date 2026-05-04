# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Navigate into workouts >> clicking run tile navigates to run screen
- Location: e2e/tests/workout.spec.ts:75:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/workout?week=2020-01-13", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { readFileSync } from 'fs'
  3   | import { join } from 'path'
  4   | 
  5   | // Loaded after global-setup seeds the data
  6   | const testData = JSON.parse(readFileSync(join(__dirname, '..', 'test-data.json'), 'utf-8')) as {
  7   |   testWeek: string
  8   |   emptyWeek: string
  9   |   strengthWorkoutId: string
  10  |   runWorkoutId: string
  11  |   restWorkoutId: string
  12  |   yogaWorkoutId: string
  13  | }
  14  | 
  15  | const GQL = 'http://localhost:4000/graphql'
  16  | 
  17  | async function uncompleteWorkout(request: Parameters<Parameters<typeof test>[1]>[0]['request'], workoutId: string) {
  18  |   await request.post(GQL, {
  19  |     data: { query: `mutation { uncompleteWorkout(workoutId: "${workoutId}") { id } }` },
  20  |   })
  21  | }
  22  | 
  23  | // ─── Weekly Calendar ─────────────────────────────────────────────────────────
  24  | 
  25  | test.describe('Weekly Calendar', () => {
  26  |   test('loads at /workout', async ({ page }) => {
  27  |     await page.goto('/workout')
  28  |     await expect(page.getByText('Training Week')).toBeVisible()
  29  |   })
  30  | 
  31  |   test('shows the test week when navigated via query param', async ({ page }) => {
  32  |     await page.goto(`/workout?week=${testData.testWeek}`)
  33  |     await expect(page.getByText('January 13')).toBeVisible()
  34  |   })
  35  | 
  36  |   test('shows all seeded workout types for the test week', async ({ page }) => {
  37  |     await page.goto(`/workout?week=${testData.testWeek}`)
  38  |     await expect(page.getByText('Strength').first()).toBeVisible()
  39  |     await expect(page.getByText('Run').first()).toBeVisible()
  40  |     await expect(page.getByText('Rest').first()).toBeVisible()
  41  |     await expect(page.getByText('Yoga').first()).toBeVisible()
  42  |   })
  43  | 
  44  |   test('chevron buttons navigate between weeks', async ({ page }) => {
  45  |     await page.goto(`/workout?week=${testData.testWeek}`)
  46  |     await expect(page.getByText('January 13')).toBeVisible()
  47  | 
  48  |     // Navigate forward one week
  49  |     const rightChevron = page.locator('button').nth(1)
  50  |     await rightChevron.click()
  51  |     await expect(page.getByText('January 20')).toBeVisible()
  52  | 
  53  |     // Navigate back
  54  |     const leftChevron = page.locator('button').nth(0)
  55  |     await leftChevron.click()
  56  |     await expect(page.getByText('January 13')).toBeVisible()
  57  |   })
  58  | 
  59  |   test('empty days show TAP TO ADD prompt', async ({ page }) => {
  60  |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  61  |     await expect(page.getByText('TAP TO ADD').first()).toBeVisible()
  62  |   })
  63  | })
  64  | 
  65  | // ─── Navigate into workouts ───────────────────────────────────────────────────
  66  | 
  67  | test.describe('Navigate into workouts', () => {
  68  |   test('clicking strength tile navigates to strength screen', async ({ page }) => {
  69  |     await page.goto(`/workout?week=${testData.testWeek}`)
  70  |     await page.getByText('Strength A').click()
  71  |     await expect(page).toHaveURL(/\/workout\/strength\//)
  72  |     await expect(page.getByText('Barbell Squat')).toBeVisible()
  73  |   })
  74  | 
  75  |   test('clicking run tile navigates to run screen', async ({ page }) => {
> 76  |     await page.goto(`/workout?week=${testData.testWeek}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  77  |     await page.getByText('Easy Run').click()
  78  |     await expect(page).toHaveURL(/\/workout\/run\//)
  79  |     await expect(page.getByText('Log your run')).toBeVisible()
  80  |   })
  81  | 
  82  |   test('clicking rest tile navigates to rest screen', async ({ page }) => {
  83  |     await page.goto(`/workout?week=${testData.testWeek}`)
  84  |     // Click the WED day label — avoids partial match on "Rest" in the footer note
  85  |     await page.getByText('WED').click()
  86  |     await expect(page).toHaveURL(/\/workout\/rest\//)
  87  |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  88  |   })
  89  | 
  90  |   test('clicking yoga tile navigates to yoga screen', async ({ page }) => {
  91  |     await page.goto(`/workout?week=${testData.testWeek}`)
  92  |     await page.getByText('Yoga').first().click()
  93  |     await expect(page).toHaveURL(/\/workout\/yoga\//)
  94  |     await expect(page.getByText('Yoga.')).toBeVisible()
  95  |   })
  96  | 
  97  |   test('back button on strength screen returns to calendar', async ({ page }) => {
  98  |     // Navigate from calendar first to establish browser history for navigate(-1)
  99  |     await page.goto(`/workout?week=${testData.testWeek}`)
  100 |     await page.getByText('Strength A').click()
  101 |     await expect(page).toHaveURL(/\/workout\/strength\//)
  102 |     await page.locator('button').first().click()
  103 |     await expect(page.getByText('Training Week')).toBeVisible()
  104 |   })
  105 | })
  106 | 
  107 | // ─── Create workouts from empty days ─────────────────────────────────────────
  108 | 
  109 | test.describe('Create workouts from empty days', () => {
  110 |   test('tapping empty day opens action sheet', async ({ page }) => {
  111 |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  112 |     await page.getByText('MON').click()
  113 |     await expect(page.getByRole('button', { name: /Add Run/ })).toBeVisible()
  114 |     await expect(page.getByRole('button', { name: /Mark Yoga/ })).toBeVisible()
  115 |     await expect(page.getByRole('button', { name: /Mark Rest/ })).toBeVisible()
  116 |     await page.keyboard.press('Escape')
  117 |   })
  118 | 
  119 |   test('Add Run navigates to run screen', async ({ page }) => {
  120 |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  121 |     // Use WED so this day is independent from rest/yoga tests
  122 |     await page.getByText('WED').click()
  123 |     await page.getByRole('button', { name: /Add Run/ }).click()
  124 |     // The Add Run sheet is now open — wait for Create button (avoids strict-mode match on footer text)
  125 |     await page.getByRole('button', { name: 'Create' }).click()
  126 |     await expect(page).toHaveURL(/\/workout\/run\//)
  127 |   })
  128 | 
  129 |   test('Mark Rest creates a rest tile on the calendar', async ({ page }) => {
  130 |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  131 |     await page.getByText('THU').click()
  132 |     await page.getByRole('button', { name: /Mark Rest/ }).click()
  133 |     // Sheet closes; the tile for THU should now show "Rest"
  134 |     await expect(page.getByRole('button', { name: /Mark Rest/ })).not.toBeVisible()
  135 |     await expect(page.getByText('Rest').first()).toBeVisible()
  136 |   })
  137 | 
  138 |   test('Mark Yoga creates a yoga tile on the calendar', async ({ page }) => {
  139 |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  140 |     await page.getByText('FRI').click()
  141 |     await page.getByRole('button', { name: /Mark Yoga/ }).click()
  142 |     await expect(page.getByRole('button', { name: /Mark Yoga/ })).not.toBeVisible()
  143 |     await expect(page.getByText('Yoga').first()).toBeVisible()
  144 |   })
  145 | })
  146 | 
  147 | // ─── Strength workout: edit fields ───────────────────────────────────────────
  148 | 
  149 | test.describe('Strength workout: edit fields', () => {
  150 |   test.beforeEach(async ({ request }) => {
  151 |     await uncompleteWorkout(request, testData.strengthWorkoutId)
  152 |   })
  153 | 
  154 |   test('pencil icon enters edit mode and shows banner', async ({ page }) => {
  155 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  156 |     await page.waitForLoadState('networkidle')
  157 |     // Pencil button is the second button in the top bar (right side)
  158 |     await page.locator('button').nth(1).click()
  159 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  160 |   })
  161 | 
  162 |   test('clicking exercise name in edit mode opens Edit Exercise sheet', async ({ page }) => {
  163 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  164 |     await page.waitForLoadState('networkidle')
  165 |     await page.locator('button').nth(1).click() // enter edit mode
  166 |     await page.getByText('Barbell Squat').click()
  167 |     await expect(page.getByText('Edit Exercise')).toBeVisible()
  168 |     await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  169 |   })
  170 | 
  171 |   test('saving a new exercise name updates the display', async ({ page }) => {
  172 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  173 |     await page.waitForLoadState('networkidle')
  174 |     await page.locator('button').nth(1).click()
  175 |     await page.getByText('Barbell Squat').click()
  176 |     await expect(page.getByText('Edit Exercise')).toBeVisible()
```