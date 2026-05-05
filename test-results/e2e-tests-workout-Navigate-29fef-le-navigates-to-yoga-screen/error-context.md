# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Navigate into workouts >> clicking yoga tile navigates to yoga screen
- Location: e2e/tests/workout.spec.ts:92:7

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
  13  |   firstSetId: string
  14  |   secondSetId: string
  15  | }
  16  | 
  17  | const GQL = 'http://localhost:4000/graphql'
  18  | 
  19  | async function uncompleteWorkout(request: Parameters<Parameters<typeof test>[1]>[0]['request'], workoutId: string) {
  20  |   await request.post(GQL, {
  21  |     data: { query: `mutation { uncompleteWorkout(workoutId: "${workoutId}") { id } }` },
  22  |   })
  23  | }
  24  | 
  25  | // ─── Weekly Calendar ─────────────────────────────────────────────────────────
  26  | 
  27  | test.describe('Weekly Calendar', () => {
  28  |   test('loads at /workout', async ({ page }) => {
  29  |     await page.goto('/workout')
  30  |     await expect(page.getByText('Training Week')).toBeVisible()
  31  |   })
  32  | 
  33  |   test('shows the test week when navigated via query param', async ({ page }) => {
  34  |     await page.goto(`/workout?week=${testData.testWeek}`)
  35  |     await expect(page.getByText('January 13')).toBeVisible()
  36  |   })
  37  | 
  38  |   test('shows all seeded workout types for the test week', async ({ page }) => {
  39  |     await page.goto(`/workout?week=${testData.testWeek}`)
  40  |     await expect(page.getByText('Strength').first()).toBeVisible()
  41  |     await expect(page.getByText('Run').first()).toBeVisible()
  42  |     await expect(page.getByText('Rest').first()).toBeVisible()
  43  |     await expect(page.getByText('Yoga').first()).toBeVisible()
  44  |   })
  45  | 
  46  |   test('chevron buttons navigate between weeks', async ({ page }) => {
  47  |     await page.goto(`/workout?week=${testData.testWeek}`)
  48  |     await expect(page.getByText('January 13')).toBeVisible()
  49  | 
  50  |     // Navigate forward one week
  51  |     const rightChevron = page.locator('button').nth(1)
  52  |     await rightChevron.click()
  53  |     await expect(page.getByText('January 20')).toBeVisible()
  54  | 
  55  |     // Navigate back
  56  |     const leftChevron = page.locator('button').nth(0)
  57  |     await leftChevron.click()
  58  |     await expect(page.getByText('January 13')).toBeVisible()
  59  |   })
  60  | 
  61  |   test('empty days show TAP TO ADD prompt', async ({ page }) => {
  62  |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  63  |     await expect(page.getByText('TAP TO ADD').first()).toBeVisible()
  64  |   })
  65  | })
  66  | 
  67  | // ─── Navigate into workouts ───────────────────────────────────────────────────
  68  | 
  69  | test.describe('Navigate into workouts', () => {
  70  |   test('clicking strength tile navigates to strength screen', async ({ page }) => {
  71  |     await page.goto(`/workout?week=${testData.testWeek}`)
  72  |     await page.getByText('Strength A').click()
  73  |     await expect(page).toHaveURL(/\/workout\/strength\//)
  74  |     await expect(page.getByText('Barbell Squat')).toBeVisible()
  75  |   })
  76  | 
  77  |   test('clicking run tile navigates to run screen', async ({ page }) => {
  78  |     await page.goto(`/workout?week=${testData.testWeek}`)
  79  |     await page.getByText('Easy Run').click()
  80  |     await expect(page).toHaveURL(/\/workout\/run\//)
  81  |     await expect(page.getByText('Log your run')).toBeVisible()
  82  |   })
  83  | 
  84  |   test('clicking rest tile navigates to rest screen', async ({ page }) => {
  85  |     await page.goto(`/workout?week=${testData.testWeek}`)
  86  |     // Click the WED day label — avoids partial match on "Rest" in the footer note
  87  |     await page.getByText('WED').click()
  88  |     await expect(page).toHaveURL(/\/workout\/rest\//)
  89  |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  90  |   })
  91  | 
  92  |   test('clicking yoga tile navigates to yoga screen', async ({ page }) => {
> 93  |     await page.goto(`/workout?week=${testData.testWeek}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  94  |     await page.getByText('Yoga').first().click()
  95  |     await expect(page).toHaveURL(/\/workout\/yoga\//)
  96  |     await expect(page.getByText('Yoga.')).toBeVisible()
  97  |   })
  98  | 
  99  |   test('back button on strength screen returns to calendar', async ({ page }) => {
  100 |     // Navigate from calendar first to establish browser history for navigate(-1)
  101 |     await page.goto(`/workout?week=${testData.testWeek}`)
  102 |     await page.getByText('Strength A').click()
  103 |     await expect(page).toHaveURL(/\/workout\/strength\//)
  104 |     await page.locator('button').first().click()
  105 |     await expect(page.getByText('Training Week')).toBeVisible()
  106 |   })
  107 | })
  108 | 
  109 | // ─── Create workouts from empty days ─────────────────────────────────────────
  110 | 
  111 | test.describe('Create workouts from empty days', () => {
  112 |   test('tapping empty day opens action sheet', async ({ page }) => {
  113 |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  114 |     await page.getByText('MON').click()
  115 |     await expect(page.getByRole('button', { name: /Add Run/ })).toBeVisible()
  116 |     await expect(page.getByRole('button', { name: /Mark Yoga/ })).toBeVisible()
  117 |     await expect(page.getByRole('button', { name: /Mark Rest/ })).toBeVisible()
  118 |     await page.keyboard.press('Escape')
  119 |   })
  120 | 
  121 |   test('Add Run navigates to run screen', async ({ page }) => {
  122 |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  123 |     // Use WED so this day is independent from rest/yoga tests
  124 |     await page.getByText('WED').click()
  125 |     await page.getByRole('button', { name: /Add Run/ }).click()
  126 |     // The Add Run sheet is now open — wait for Create button (avoids strict-mode match on footer text)
  127 |     await page.getByRole('button', { name: 'Create' }).click()
  128 |     await expect(page).toHaveURL(/\/workout\/run\//)
  129 |   })
  130 | 
  131 |   test('Mark Rest creates a rest tile on the calendar', async ({ page }) => {
  132 |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  133 |     await page.getByText('THU').click()
  134 |     await page.getByRole('button', { name: /Mark Rest/ }).click()
  135 |     // Sheet closes; the tile for THU should now show "Rest"
  136 |     await expect(page.getByRole('button', { name: /Mark Rest/ })).not.toBeVisible()
  137 |     await expect(page.getByText('Rest').first()).toBeVisible()
  138 |   })
  139 | 
  140 |   test('Mark Yoga creates a yoga tile on the calendar', async ({ page }) => {
  141 |     await page.goto(`/workout?week=${testData.emptyWeek}`)
  142 |     await page.getByText('FRI').click()
  143 |     await page.getByRole('button', { name: /Mark Yoga/ }).click()
  144 |     await expect(page.getByRole('button', { name: /Mark Yoga/ })).not.toBeVisible()
  145 |     await expect(page.getByText('Yoga').first()).toBeVisible()
  146 |   })
  147 | })
  148 | 
  149 | // ─── Strength workout: edit fields ───────────────────────────────────────────
  150 | 
  151 | test.describe('Strength workout: edit fields', () => {
  152 |   test.beforeEach(async ({ request }) => {
  153 |     await uncompleteWorkout(request, testData.strengthWorkoutId)
  154 |   })
  155 | 
  156 |   test('pencil icon enters edit mode and shows banner', async ({ page }) => {
  157 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  158 |     await page.waitForLoadState('networkidle')
  159 |     // Pencil button is the second button in the top bar (right side)
  160 |     await page.locator('button').nth(1).click()
  161 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  162 |   })
  163 | 
  164 |   test('clicking exercise name in edit mode opens Edit Exercise sheet', async ({ page }) => {
  165 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  166 |     await page.waitForLoadState('networkidle')
  167 |     await page.locator('button').nth(1).click() // enter edit mode
  168 |     await page.getByText('Barbell Squat').click()
  169 |     await expect(page.getByText('Edit Exercise')).toBeVisible()
  170 |     await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  171 |   })
  172 | 
  173 |   test('saving a new exercise name updates the display', async ({ page }) => {
  174 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  175 |     await page.waitForLoadState('networkidle')
  176 |     await page.locator('button').nth(1).click()
  177 |     await page.getByText('Barbell Squat').click()
  178 |     await expect(page.getByText('Edit Exercise')).toBeVisible()
  179 | 
  180 |     const nameInput = page.getByRole('textbox').last()
  181 |     await nameInput.fill('Back Squat')
  182 |     await page.getByRole('button', { name: 'Save' }).click()
  183 | 
  184 |     await expect(page.getByText('Back Squat')).toBeVisible()
  185 |     await expect(page.getByText('Barbell Squat')).not.toBeVisible()
  186 | 
  187 |     // Restore original name
  188 |     await page.getByText('Back Squat').click()
  189 |     await page.getByRole('textbox').last().fill('Barbell Squat')
  190 |     await page.getByRole('button', { name: 'Save' }).click()
  191 |   })
  192 | 
  193 |   test('clicking REPS target in edit mode opens inline input', async ({ page }) => {
```