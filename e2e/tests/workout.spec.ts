import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

// Loaded after global-setup seeds the data
const testData = JSON.parse(readFileSync(join(__dirname, '..', 'test-data.json'), 'utf-8')) as {
  testWeek: string
  emptyWeek: string
  strengthWorkoutId: string
  strengthWorkoutId2: string
  runWorkoutId: string
  runWorkoutId2: string
  restWorkoutId: string
  yogaWorkoutId: string
  firstSetId: string
  secondSetId: string
  thirdSetId: string
}

// Per-project helpers: chromium uses the primary workout, mobile-chrome uses the secondary.
// This prevents cross-browser races when one project completes a workout while the other
// is still running its own tests on the same shared resource.
type TI = { project: { name: string } }
const strengthId = (t: TI) => t.project.name === 'chromium' ? testData.strengthWorkoutId : testData.strengthWorkoutId2
const runId = (t: TI) => t.project.name === 'chromium' ? testData.runWorkoutId : testData.runWorkoutId2

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
    await page.getByText('Easy Run', { exact: true }).click()
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

  test('Add Run navigates to run screen', async ({ page }, testInfo) => {
    // Use project-exclusive days to prevent races: chromium=WED, mobile-chrome=SAT
    const day = testInfo.project.name === 'chromium' ? 'WED' : 'SAT'
    await page.goto(`/workout?week=${testData.emptyWeek}`)
    await page.getByText(day).click()
    await page.getByRole('button', { name: /Add Run/ }).click()
    // The Add Run sheet is now open — wait for Create button (avoids strict-mode match on footer text)
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page).toHaveURL(/\/workout\/run\//)
  })

  test('Mark Rest creates a rest tile on the calendar', async ({ page }, testInfo) => {
    // Use project-exclusive days to prevent races: chromium=THU, mobile-chrome=SUN
    const day = testInfo.project.name === 'chromium' ? 'THU' : 'SUN'
    await page.goto(`/workout?week=${testData.emptyWeek}`)
    await page.getByText(day).click()
    await page.getByRole('button', { name: /Mark Rest/ }).click()
    // Sheet closes; the tile for that day should now show "Rest"
    await expect(page.getByRole('button', { name: /Mark Rest/ })).not.toBeVisible()
    await expect(page.getByText('Rest').first()).toBeVisible()
  })

  test('Mark Yoga creates a yoga tile on the calendar', async ({ page }, testInfo) => {
    // Use project-exclusive days to prevent races: chromium=FRI, mobile-chrome=TUE
    const day = testInfo.project.name === 'chromium' ? 'FRI' : 'TUE'
    await page.goto(`/workout?week=${testData.emptyWeek}`)
    await page.getByText(day).click()
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

    // Scope to just the Barbell Squat exercise card — isolates from concurrent cross-project
    // mutations on other exercises or set counts.
    const squatCard = page.locator('[data-exercise-name="Barbell Squat"]')
    const inputsBefore = await squatCard.locator('input').count()

    await squatCard.getByRole('button', { name: /Add Set/ }).click()
    // Both browser projects may add sets concurrently; assert count increased, not exact delta.
    await expect(squatCard.locator('input')).not.toHaveCount(inputsBefore)
  })

  test('trash icon removes a set from an exercise', async ({ page }, testInfo) => {
    // Each browser project deletes a DIFFERENT set to prevent concurrent-deletion races:
    // chromium deletes SET 1 (firstSetId), mobile-chrome deletes SET 3 (thirdSetId).
    // Both can run simultaneously without conflict, and secondSetId remains intact for toggle tests.
    const targetSetId = testInfo.project.name === 'chromium' ? testData.firstSetId : testData.thirdSetId

    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').nth(1).click()
    await expect(page.getByText('EDITING PLAN')).toBeVisible()

    const targetRow = page.locator(`[data-set-id="${targetSetId}"]`)
    await expect(targetRow).toBeVisible()

    // Click the trash icon specifically (each set row also has a checkmark button)
    await targetRow.locator('button').filter({
      has: page.locator('[d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5l.5-9"]'),
    }).click()

    await expect(targetRow).not.toBeVisible()
  })
})

// ─── Strength workout: log actuals and complete ───────────────────────────────

test.describe('Strength workout: log actuals and complete', () => {
  // Each browser project uses its own workout to prevent cross-browser races:
  // chromium → strengthWorkoutId (Strength A), mobile-chrome → strengthWorkoutId2 (Strength B)
  test.beforeEach(async ({ request }, testInfo) => {
    await uncompleteWorkout(request, strengthId(testInfo))
  })

  test('entering values in pill inputs saves actuals', async ({ page }, testInfo) => {
    await page.goto(`/workout/strength/${strengthId(testInfo)}`)
    await page.waitForLoadState('networkidle')

    // index 0 = REPS input for SET 1 of Barbell Squat
    await page.locator('input').nth(0).fill('8')
    // index 1 = LBS input
    await page.locator('input').nth(1).fill('135')

    // Wait for debounce to fire (500ms)
    await page.waitForTimeout(600)
    // If no error thrown, the mutation succeeded
  })

  test('clicking checkmark marks a set complete and updates progress', async ({ page }, testInfo) => {
    await page.goto(`/workout/strength/${strengthId(testInfo)}`)
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

  test('complete workout button is visible when not complete', async ({ page }, testInfo) => {
    await page.goto(`/workout/strength/${strengthId(testInfo)}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: /Mark Workout Complete|Finish/ })).toBeVisible()
  })

  test('completing the workout navigates back and shows complete badge', async ({ page }, testInfo) => {
    // Navigate from calendar to establish browser history for navigate(-1).
    // Each project clicks its own tile to avoid races on the shared "Strength A" workout.
    const tileText = testInfo.project.name === 'chromium' ? 'Strength A' : 'Strength B'
    await page.goto(`/workout?week=${testData.testWeek}`)
    await page.getByText(tileText).click()
    await expect(page).toHaveURL(/\/workout\/strength\//)

    await page.getByRole('button', { name: /Mark Workout Complete|Finish/ }).click()
    // Confirmation sheet opens
    await expect(page.getByText('Mark workout complete?')).toBeVisible()
    await page.getByRole('button', { name: 'Mark Complete' }).click()

    // Navigates back to weekly calendar
    await expect(page).toHaveURL(/\/workout(\?|$)/)
    await expect(page.getByText('✓ COMPLETE').first()).toBeVisible()
  })

  test('marking a completed strength workout incomplete clears the banner', async ({ page, request }, testInfo) => {
    const wid = strengthId(testInfo)
    // First complete the workout via API
    await request.post(GQL, {
      data: { query: `mutation { completeWorkout(workoutId: "${wid}") { id } }` },
    })

    await page.goto(`/workout/strength/${wid}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('✓ WORKOUT COMPLETE')).toBeVisible()
    await page.getByText('MARK INCOMPLETE').click()

    await expect(page.getByText('✓ WORKOUT COMPLETE')).not.toBeVisible()
    await expect(page.getByText('SETS LOGGED')).toBeVisible()
  })
})

// ─── Run workout ──────────────────────────────────────────────────────────────

test.describe('Run workout', () => {
  // Each browser project uses its own run workout to prevent cross-browser races:
  // chromium → runWorkoutId (Easy Run), mobile-chrome → runWorkoutId2 (Easy Run 2)
  test.beforeEach(async ({ request }, testInfo) => {
    await uncompleteWorkout(request, runId(testInfo))
  })

  test('shows prescribed targets', async ({ page }, testInfo) => {
    await page.goto(`/workout/run/${runId(testInfo)}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('PRESCRIBED')).toBeVisible()
    await expect(page.getByText('9:30')).toBeVisible() // target pace — unique value on this page
  })

  test('shows Log your run heading when not complete', async ({ page }, testInfo) => {
    await page.goto(`/workout/run/${runId(testInfo)}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Log your run')).toBeVisible()
    await expect(page.getByRole('button', { name: /Distance & Time required|Log Run/ })).toBeVisible()
  })

  test('Log Run button is disabled until distance and time are filled', async ({ page }, testInfo) => {
    await page.goto(`/workout/run/${runId(testInfo)}`)
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

  test('logging a run switches to view mode', async ({ page, request }, testInfo) => {
    const rid = runId(testInfo)
    // Pre-log via API — the UI form calls navigate(-1) immediately after logging,
    // so view mode is only reachable by navigating to an already-completed run
    await request.post(GQL, {
      data: {
        query: `mutation { logRunWorkout(workoutId: "${rid}", actualMiles: 3.5, actualTime: 1950) { id } }`,
      },
    })

    await page.goto(`/workout/run/${rid}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('How it went')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit Run' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark Incomplete' })).toBeVisible()
  })

  test('Edit Run switches back to form mode', async ({ page, request }, testInfo) => {
    const rid = runId(testInfo)
    // Pre-complete the run
    await request.post(GQL, {
      data: {
        query: `mutation { logRunWorkout(workoutId: "${rid}", actualMiles: 3.5, actualTime: 1950) { id } }`,
      },
    })

    await page.goto(`/workout/run/${rid}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('How it went')).toBeVisible()

    await page.getByRole('button', { name: 'Edit Run' }).click()
    await expect(page.getByRole('button', { name: /Save Changes/ })).toBeVisible()
  })

  test('Mark Incomplete on completed run returns to entry form', async ({ page, request }, testInfo) => {
    const rid = runId(testInfo)
    await request.post(GQL, {
      data: {
        query: `mutation { logRunWorkout(workoutId: "${rid}", actualMiles: 3.5, actualTime: 1950) { id } }`,
      },
    })

    await page.goto(`/workout/run/${rid}`)
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

// ─── Back navigation ─────────────────────────────────────────────────────────

test.describe('Back navigation', () => {
  test.beforeEach(async ({ request }) => {
    // Ensure workout notes are at their original value so the calendar tile shows "Strength A"
    await request.post(GQL, {
      data: { query: `mutation { updateWorkoutNotes(workoutId: "${testData.strengthWorkoutId}", notes: "Strength A") { id } }` },
    })
  })

  test('back chevron from calendar-navigated workout returns to that week', async ({ page }) => {
    await page.goto(`/workout?week=${testData.testWeek}`)
    await page.waitForLoadState('networkidle')
    await page.getByText('Strength A').click()
    await expect(page).toHaveURL(/\/workout\/strength\//)
    await page.locator('button').first().click()
    await expect(page).toHaveURL(new RegExp(`/workout\\?week=${testData.testWeek}`))
    await expect(page.getByText('Training Week')).toBeVisible()
  })

  test('back chevron opened directly with no prior history goes to /workout', async ({ page }) => {
    // Simulate "open in new tab" — navigate directly to the workout URL with no prior history
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await page.locator('button').first().click()
    await expect(page).toHaveURL(/\/workout(\?|$)/)
    await expect(page.getByText('Training Week')).toBeVisible()
  })
})

// ─── Workout notes ────────────────────────────────────────────────────────────

test.describe('Workout notes', () => {
  test.beforeEach(async ({ request }) => {
    await uncompleteWorkout(request, testData.strengthWorkoutId)
    await request.post(GQL, {
      data: { query: `mutation { updateWorkoutNotes(workoutId: "${testData.strengthWorkoutId}", notes: "Strength A") { id } }` },
    })
  })

  test('notes save on blur when workout is incomplete', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')

    const notes = page.getByPlaceholder('Add a note for this workout…')
    await notes.fill('Feeling strong today')
    await notes.blur()
    await page.waitForTimeout(500)

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(notes).toHaveValue('Feeling strong today')
  })

  test('notes save on blur even when workout is already complete', async ({ page, request }) => {
    await request.post(GQL, {
      data: { query: `mutation { completeWorkout(workoutId: "${testData.strengthWorkoutId}") { id } }` },
    })

    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('✓ WORKOUT COMPLETE')).toBeVisible()

    const notes = page.getByPlaceholder('Add a note for this workout…')
    await notes.fill('PR on squats!')
    await notes.blur()
    await page.waitForTimeout(500)

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(notes).toHaveValue('PR on squats!')
  })
})

// ─── Strength workout: set completion toggle ──────────────────────────────────

test.describe('Strength workout: set completion toggle', () => {
  // Serial mode prevents the three tests from racing each other within a single browser run.
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ request }) => {
    await uncompleteWorkout(request, testData.strengthWorkoutId)
    // Reset secondSetId by its stable DB ID — unaffected by other tests deleting/adding sets.
    await request.post(GQL, {
      data: { query: `mutation { uncompleteSet(setId: "${testData.secondSetId}") { id } }` },
    })
  })

  test('completing a set disables its inputs', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')

    // Use data-set-id (the DB primary key) — globally unique, survives other sets being deleted.
    const setRow = page.locator(`[data-set-id="${testData.secondSetId}"]`)
    const repsInput = setRow.locator('input').nth(0)

    await expect(repsInput).toBeEnabled()

    await setRow.locator('button').filter({
      has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
    }).click()

    await expect(repsInput).toBeDisabled()
  })

  test('tapping a completed checkmark re-enables the set inputs', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')

    const setRow = page.locator(`[data-set-id="${testData.secondSetId}"]`)
    const checkmark = setRow.locator('button').filter({
      has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
    })
    const repsInput = setRow.locator('input').nth(0)
    const lbsInput = setRow.locator('input').nth(1)
    const rpeInput = setRow.locator('input').nth(2)

    await checkmark.click()
    await expect(repsInput).toBeDisabled()

    // Tap again to un-complete
    await checkmark.click()
    await expect(repsInput).toBeEnabled()
    await expect(lbsInput).toBeEnabled()
    await expect(rpeInput).toBeEnabled()
  })

  test('reps, weight, and RPE can all be edited after un-completing a set', async ({ page }) => {
    await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
    await page.waitForLoadState('networkidle')

    const setRow = page.locator(`[data-set-id="${testData.secondSetId}"]`)
    const checkmark = setRow.locator('button').filter({
      has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
    })
    const repsInput = setRow.locator('input').nth(0)

    // Complete then un-complete
    await checkmark.click()
    await expect(repsInput).toBeDisabled()
    await checkmark.click()
    await expect(repsInput).toBeEnabled()

    // Edit all three actuals
    await setRow.locator('input').nth(0).fill('10')
    await setRow.locator('input').nth(1).fill('140')
    await setRow.locator('input').nth(2).fill('8')
    await page.waitForTimeout(600) // debounce

    // Re-complete and confirm it locks again
    await checkmark.click()
    await expect(repsInput).toBeDisabled()
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
