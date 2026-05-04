import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

// Loaded after global-setup seeds the data
const testData = JSON.parse(readFileSync(join(__dirname, '..', 'test-data.json'), 'utf-8')) as {
  testWeek: string
  emptyWeek: string
  strengthWorkoutId: string
  runWorkoutId: string
  restWorkoutId: string
  yogaWorkoutId: string
}

const GQL = 'http://localhost:4000/graphql'

async function uncompleteWorkout(request: Parameters<Parameters<typeof test>[1]>[0]['request'], workoutId: string) {
  await request.post(GQL, {
    data: { query: `mutation { uncompleteWorkout(workoutId: "${workoutId}") { id } }` },
  })
}

// ─── Weekly Calendar ─────────────────────────────────────────────────────────

test.describe('Weekly Calendar', () => {
  test('loads at /workout', async ({ page }) => {
    await page.goto('/workout')
    await expect(page.getByText('Training Week')).toBeVisible()
  })

  test('shows the test week when navigated via query param', async ({ page }) => {
    await page.goto(`/workout?week=${testData.testWeek}`)
    await expect(page.getByText('January 13')).toBeVisible()
  })

  test('shows all seeded workout types for the test week', async ({ page }) => {
    await page.goto(`/workout?week=${testData.testWeek}`)
    await expect(page.getByText('Strength').first()).toBeVisible()
    await expect(page.getByText('Run').first()).toBeVisible()
    await expect(page.getByText('Rest').first()).toBeVisible()
    await expect(page.getByText('Yoga').first()).toBeVisible()
  })

  test('chevron buttons navigate between weeks', async ({ page }) => {
    await page.goto(`/workout?week=${testData.testWeek}`)
    await expect(page.getByText('January 13')).toBeVisible()

    // Navigate forward one week
    const rightChevron = page.locator('button').nth(1)
    await rightChevron.click()
    await expect(page.getByText('January 20')).toBeVisible()

    // Navigate back
    const leftChevron = page.locator('button').nth(0)
    await leftChevron.click()
    await expect(page.getByText('January 13')).toBeVisible()
  })

  test('empty days show TAP TO ADD prompt', async ({ page }) => {
    await page.goto(`/workout?week=${testData.emptyWeek}`)
    await expect(page.getByText('TAP TO ADD').first()).toBeVisible()
  })
})

// ─── Navigate into workouts ───────────────────────────────────────────────────

test.describe('Navigate into workouts', () => {
  test('clicking strength tile navigates to strength screen', async ({ page }) => {
    await page.goto(`/workout?week=${testData.testWeek}`)
    await page.getByText('Strength A').click()
    await expect(page).toHaveURL(/\/workout\/strength\//)
    await expect(page.getByText('Barbell Squat')).toBeVisible()
  })

  test('clicking run tile navigates to run screen', async ({ page }) => {
    await page.goto(`/workout?week=${testData.testWeek}`)
    await page.getByText('Easy Run').click()
    await expect(page).toHaveURL(/\/workout\/run\//)
    await expect(page.getByText('Log your run')).toBeVisible()
  })

  test('clicking rest tile navigates to rest screen', async ({ page }) => {
    await page.goto(`/workout?week=${testData.testWeek}`)
    // Click the WED day label — avoids partial match on "Rest" in the footer note
    await page.getByText('WED').click()
    await expect(page).toHaveURL(/\/workout\/rest\//)
    await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  })

  test('clicking yoga tile navigates to yoga screen', async ({ page }) => {
    await page.goto(`/workout?week=${testData.testWeek}`)
    await page.getByText('Yoga').first().click()
    await expect(page).toHaveURL(/\/workout\/yoga\//)
    await expect(page.getByText('Yoga.')).toBeVisible()
  })

  test('back button on strength screen returns to calendar', async ({ page }) => {
    // Navigate from calendar first to establish browser history for navigate(-1)
    await page.goto(`/workout?week=${testData.testWeek}`)
    await page.getByText('Strength A').click()
    await expect(page).toHaveURL(/\/workout\/strength\//)
    await page.locator('button').first().click()
    await expect(page.getByText('Training Week')).toBeVisible()
  })
})

// ─── Create workouts from empty days ─────────────────────────────────────────

test.describe('Create workouts from empty days', () => {
  test('tapping empty day opens action sheet', async ({ page }) => {
    await page.goto(`/workout?week=${testData.emptyWeek}`)
    await page.getByText('MON').click()
    await expect(page.getByRole('button', { name: /Add Run/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Mark Yoga/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Mark Rest/ })).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('Add Run navigates to run screen', async ({ page }) => {
    await page.goto(`/workout?week=${testData.emptyWeek}`)
    // Use WED so this day is independent from rest/yoga tests
    await page.getByText('WED').click()
    await page.getByRole('button', { name: /Add Run/ }).click()
    // The Add Run sheet is now open — wait for Create button (avoids strict-mode match on footer text)
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page).toHaveURL(/\/workout\/run\//)
  })

  test('Mark Rest creates a rest tile on the calendar', async ({ page }) => {
    await page.goto(`/workout?week=${testData.emptyWeek}`)
    await page.getByText('THU').click()
    await page.getByRole('button', { name: /Mark Rest/ }).click()
    // Sheet closes; the tile for THU should now show "Rest"
    await expect(page.getByRole('button', { name: /Mark Rest/ })).not.toBeVisible()
    await expect(page.getByText('Rest').first()).toBeVisible()
  })

  test('Mark Yoga creates a yoga tile on the calendar', async ({ page }) => {
    await page.goto(`/workout?week=${testData.emptyWeek}`)
    await page.getByText('FRI').click()
    await page.getByRole('button', { name: /Mark Yoga/ }).click()
    await expect(page.getByRole('button', { name: /Mark Yoga/ })).not.toBeVisible()
    await expect(page.getByText('Yoga').first()).toBeVisible()
  })
})

// ─── Strength workout: edit fields ───────────────────────────────────────────

test.describe('Strength workout: edit fields', () => {
  test.beforeEach(async ({ request }) => {
    await uncompleteWorkout(request, testData.strengthWorkoutId)
  })

  test('pencil icon enters edit mode and shows banner', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    // Pencil button is the second button in the top bar (right side)
    await page.locator('button').nth(1).click()
    await expect(page.getByText('EDITING PLAN')).toBeVisible()
  })

  test('clicking exercise name in edit mode opens Edit Exercise sheet', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click() // enter edit mode
    await page.getByText('Barbell Squat').click()
    await expect(page.getByText('Edit Exercise')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('saving a new exercise name updates the display', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click()
    await page.getByText('Barbell Squat').click()
    await expect(page.getByText('Edit Exercise')).toBeVisible()

    const nameInput = page.getByRole('textbox').last()
    await nameInput.fill('Back Squat')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Back Squat')).toBeVisible()
    await expect(page.getByText('Barbell Squat')).not.toBeVisible()

    // Restore original name
    await page.getByText('Back Squat').click()
    await page.getByRole('textbox').last().fill('Barbell Squat')
    await page.getByRole('button', { name: 'Save' }).click()
  })

  test('clicking REPS target in edit mode opens inline input', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click() // enter edit mode
    await expect(page.getByText('EDITING PLAN')).toBeVisible()

    await page.getByText('REPS').first().click()
    // Spec input appears in the top row — first in DOM order, before PillInputs
    await expect(page.locator('input').first()).toBeVisible()
  })

  test('editing target reps updates the displayed value', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click()
    await expect(page.getByText('EDITING PLAN')).toBeVisible()

    await page.getByText('REPS').first().click()
    // Spec input is first in DOM (top row before PillInputs in bottom row)
    const specInput = page.locator('input').first()
    await specInput.fill('12')
    await page.keyboard.press('Enter')

    await expect(page.getByText('12').first()).toBeVisible()

    // Restore to original
    await page.getByText('REPS').first().click()
    await page.locator('input').first().fill('8')
    await page.keyboard.press('Enter')
  })

  test('editing target weight updates the displayed value', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click()
    await expect(page.getByText('EDITING PLAN')).toBeVisible()

    await page.getByText('LBS').first().click()
    // Spec input is first in DOM (top row before PillInputs in bottom row)
    const specInput = page.locator('input').first()
    await specInput.fill('145')
    await page.keyboard.press('Enter')

    await expect(page.getByText('145').first()).toBeVisible()

    // Restore
    await page.getByText('LBS').first().click()
    await page.locator('input').first().fill('135')
    await page.keyboard.press('Enter')
  })

  test('editing target RPE updates the displayed value', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click()
    await expect(page.getByText('EDITING PLAN')).toBeVisible()

    await page.getByText('RPE').first().click()
    // Spec input is first in DOM (top row before PillInputs in bottom row)
    const specInput = page.locator('input').first()
    await specInput.fill('8')
    await page.keyboard.press('Enter')

    await expect(page.getByText('8').first()).toBeVisible()

    // Restore
    await page.getByText('RPE').first().click()
    await page.locator('input').first().fill('7')
    await page.keyboard.press('Enter')
  })

  test('Add Set button appends a new set to an exercise', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click()
    await expect(page.getByText('EDITING PLAN')).toBeVisible()

    // Count PillInputs before (2 exercises × 3 sets × 3 pill inputs = 18)
    const inputsBefore = await page.locator('input').count()

    await page.getByRole('button', { name: /Add Set/ }).first().click()
    // Wait for the new row's PillInputs to appear in DOM (+3 inputs)
    await expect(page.locator('input')).toHaveCount(inputsBefore + 3)
  })

  test('trash icon removes a set from an exercise', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click()
    await expect(page.getByText('EDITING PLAN')).toBeVisible()

    const inputsBefore = await page.locator('input').count()

    // In edit mode: btn 0=back, btn 1=pencil, btn 2=trash-SET1
    await page.locator('button').nth(2).click()
    await page.waitForLoadState('networkidle')

    const inputsAfter = await page.locator('input').count()
    expect(inputsAfter).toBe(inputsBefore - 3) // removed 1 set = 3 fewer pill inputs
  })
})

// ─── Strength workout: log actuals and complete ───────────────────────────────

test.describe('Strength workout: log actuals and complete', () => {
  test.beforeEach(async ({ request }) => {
    await uncompleteWorkout(request, testData.strengthWorkoutId)
  })

  test('entering values in pill inputs saves actuals', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')

    // index 0 = REPS input for SET 1 of Barbell Squat
    await page.locator('input').nth(0).fill('8')
    // index 1 = LBS input
    await page.locator('input').nth(1).fill('135')

    // Wait for debounce to fire (500ms)
    await page.waitForTimeout(600)
    // If no error thrown, the mutation succeeded
  })

  test('clicking checkmark marks a set complete and updates progress', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')

    // Progress shows "0/N" initially
    const progressText = page.getByText(/^0\//)
    await expect(progressText).toBeVisible()

    // Complete SET 1 — the checkmark button with the unique SVG path
    const completeButtons = page.locator('button').filter({
      has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
    })
    await completeButtons.first().click()

    // Progress should now show "1/N"
    await expect(page.getByText(/^1\//)).toBeVisible()
  })

  test('complete workout button is visible when not complete', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: /Mark Workout Complete|Finish/ })).toBeVisible()
  })

  test('completing the workout navigates back and shows complete badge', async ({ page }) => {
    // Navigate from calendar to establish browser history for navigate(-1)
    await page.goto(`/workout?week=${testData.testWeek}`)
    await page.getByText('Strength A').click()
    await expect(page).toHaveURL(/\/workout\/strength\//)

    await page.getByRole('button', { name: /Mark Workout Complete|Finish/ }).click()
    // Confirmation sheet opens
    await expect(page.getByText('Mark workout complete?')).toBeVisible()
    await page.getByRole('button', { name: 'Mark Complete' }).click()

    // Navigates back to weekly calendar
    await expect(page).toHaveURL(/\/workout(\?|$)/)
    await expect(page.getByText('✓ COMPLETE').first()).toBeVisible()
  })

  test('marking a completed strength workout incomplete clears the banner', async ({ page, request }) => {
    // First complete the workout via API
    await request.post(GQL, {
      data: { query: `mutation { completeWorkout(workoutId: "${testData.strengthWorkoutId}") { id } }` },
    })

    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('✓ WORKOUT COMPLETE')).toBeVisible()
    await page.getByText('MARK INCOMPLETE').click()

    await expect(page.getByText('✓ WORKOUT COMPLETE')).not.toBeVisible()
    await expect(page.getByText('SETS LOGGED')).toBeVisible()
  })
})

// ─── Run workout ──────────────────────────────────────────────────────────────

test.describe('Run workout', () => {
  test.beforeEach(async ({ request }) => {
    await uncompleteWorkout(request, testData.runWorkoutId)
  })

  test('shows prescribed targets', async ({ page }) => {
    await page.goto(`/workout/run/${testData.runWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('PRESCRIBED')).toBeVisible()
    await expect(page.getByText('9:30')).toBeVisible() // target pace — unique value on this page
  })

  test('shows Log your run heading when not complete', async ({ page }) => {
    await page.goto(`/workout/run/${testData.runWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Log your run')).toBeVisible()
    await expect(page.getByRole('button', { name: /Distance & Time required|Log Run/ })).toBeVisible()
  })

  test('Log Run button is disabled until distance and time are filled', async ({ page }) => {
    await page.goto(`/workout/run/${testData.runWorkoutId}`)
    await page.waitForLoadState('networkidle')

    const logBtn = page.getByRole('button', { name: /Distance & Time required/ })
    await expect(logBtn).toBeDisabled()

    // Fill distance only — still disabled
    await page.locator('input').nth(0).fill('3.5')
    await expect(page.getByRole('button', { name: /Distance & Time required/ })).toBeDisabled()

    // Fill time — button becomes enabled
    await page.locator('input').nth(1).click()
    await page.locator('input').nth(1).pressSequentially('3230')
    await expect(page.getByRole('button', { name: 'Log Run' })).toBeEnabled()
  })

  test('logging a run switches to view mode', async ({ page, request }) => {
    // Pre-log via API — the UI form calls navigate(-1) immediately after logging,
    // so view mode is only reachable by navigating to an already-completed run
    await request.post(GQL, {
      data: {
        query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
      },
    })

    await page.goto(`/workout/run/${testData.runWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('How it went')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit Run' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark Incomplete' })).toBeVisible()
  })

  test('Edit Run switches back to form mode', async ({ page, request }) => {
    // Pre-complete the run
    await request.post(GQL, {
      data: {
        query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
      },
    })

    await page.goto(`/workout/run/${testData.runWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('How it went')).toBeVisible()

    await page.getByRole('button', { name: 'Edit Run' }).click()
    await expect(page.getByRole('button', { name: /Save Changes/ })).toBeVisible()
  })

  test('Mark Incomplete on completed run returns to entry form', async ({ page, request }) => {
    await request.post(GQL, {
      data: {
        query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
      },
    })

    await page.goto(`/workout/run/${testData.runWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('How it went')).toBeVisible()

    await page.getByRole('button', { name: 'Mark Incomplete' }).click()
    await expect(page.getByText('Log your run')).toBeVisible()
  })
})

// ─── Rest day ─────────────────────────────────────────────────────────────────

test.describe('Rest day', () => {
  test.beforeEach(async ({ request }) => {
    await uncompleteWorkout(request, testData.restWorkoutId)
  })

  test('shows Mark Day Complete button when not complete', async ({ page }) => {
    await page.goto(`/workout/rest/${testData.restWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  })

  test('clicking Mark Day Complete shows completion banner', async ({ page }) => {
    await page.goto(`/workout/rest/${testData.restWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Mark Day Complete' }).click()
    await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
    await expect(page.getByText('MARK INCOMPLETE')).toBeVisible()
  })

  test('MARK INCOMPLETE on rest day reverts to complete button', async ({ page }) => {
    await page.goto(`/workout/rest/${testData.restWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Mark Day Complete' }).click()
    await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()

    await page.getByText('MARK INCOMPLETE').click()
    await expect(page.getByText('✓ DAY COMPLETE')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  })
})

// ─── Yoga day ─────────────────────────────────────────────────────────────────

test.describe('Yoga day', () => {
  test.beforeEach(async ({ request }) => {
    await uncompleteWorkout(request, testData.yogaWorkoutId)
  })

  test('shows Mark Day Complete button when not complete', async ({ page }) => {
    await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Yoga.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  })

  test('clicking Mark Day Complete shows completion banner', async ({ page }) => {
    await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Mark Day Complete' }).click()
    await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
    await expect(page.getByText('MARK INCOMPLETE')).toBeVisible()
  })

  test('MARK INCOMPLETE on yoga day reverts to complete button', async ({ page }) => {
    await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Mark Day Complete' }).click()
    await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()

    await page.getByText('MARK INCOMPLETE').click()
    await expect(page.getByText('✓ DAY COMPLETE')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  })
})
