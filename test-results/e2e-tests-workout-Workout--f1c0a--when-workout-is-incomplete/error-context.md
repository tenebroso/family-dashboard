# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Workout notes >> notes save on blur when workout is incomplete
- Location: e2e/tests/workout.spec.ts:532:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/workout/strength/cmortljrn0003lr99ssr2t63a", waiting until "load"

```

# Test source

```ts
  433 |     })
  434 | 
  435 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  436 |     await page.waitForLoadState('networkidle')
  437 |     await expect(page.getByText('How it went')).toBeVisible()
  438 | 
  439 |     await page.getByRole('button', { name: 'Edit Run' }).click()
  440 |     await expect(page.getByRole('button', { name: /Save Changes/ })).toBeVisible()
  441 |   })
  442 | 
  443 |   test('Mark Incomplete on completed run returns to entry form', async ({ page, request }) => {
  444 |     await request.post(GQL, {
  445 |       data: {
  446 |         query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
  447 |       },
  448 |     })
  449 | 
  450 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  451 |     await page.waitForLoadState('networkidle')
  452 |     await expect(page.getByText('How it went')).toBeVisible()
  453 | 
  454 |     await page.getByRole('button', { name: 'Mark Incomplete' }).click()
  455 |     await expect(page.getByText('Log your run')).toBeVisible()
  456 |   })
  457 | })
  458 | 
  459 | // ─── Rest day ─────────────────────────────────────────────────────────────────
  460 | 
  461 | test.describe('Rest day', () => {
  462 |   test.beforeEach(async ({ request }) => {
  463 |     await uncompleteWorkout(request, testData.restWorkoutId)
  464 |   })
  465 | 
  466 |   test('shows Mark Day Complete button when not complete', async ({ page }) => {
  467 |     await page.goto(`/workout/rest/${testData.restWorkoutId}`)
  468 |     await page.waitForLoadState('networkidle')
  469 |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  470 |   })
  471 | 
  472 |   test('clicking Mark Day Complete shows completion banner', async ({ page }) => {
  473 |     await page.goto(`/workout/rest/${testData.restWorkoutId}`)
  474 |     await page.waitForLoadState('networkidle')
  475 |     await page.getByRole('button', { name: 'Mark Day Complete' }).click()
  476 |     await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
  477 |     await expect(page.getByText('MARK INCOMPLETE')).toBeVisible()
  478 |   })
  479 | 
  480 |   test('MARK INCOMPLETE on rest day reverts to complete button', async ({ page }) => {
  481 |     await page.goto(`/workout/rest/${testData.restWorkoutId}`)
  482 |     await page.waitForLoadState('networkidle')
  483 |     await page.getByRole('button', { name: 'Mark Day Complete' }).click()
  484 |     await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
  485 | 
  486 |     await page.getByText('MARK INCOMPLETE').click()
  487 |     await expect(page.getByText('✓ DAY COMPLETE')).not.toBeVisible()
  488 |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  489 |   })
  490 | })
  491 | 
  492 | // ─── Back navigation ─────────────────────────────────────────────────────────
  493 | 
  494 | test.describe('Back navigation', () => {
  495 |   test.beforeEach(async ({ request }) => {
  496 |     // Ensure workout notes are at their original value so the calendar tile shows "Strength A"
  497 |     await request.post(GQL, {
  498 |       data: { query: `mutation { updateWorkoutNotes(workoutId: "${testData.strengthWorkoutId}", notes: "Strength A") { id } }` },
  499 |     })
  500 |   })
  501 | 
  502 |   test('back chevron from calendar-navigated workout returns to that week', async ({ page }) => {
  503 |     await page.goto(`/workout?week=${testData.testWeek}`)
  504 |     await page.waitForLoadState('networkidle')
  505 |     await page.getByText('Strength A').click()
  506 |     await expect(page).toHaveURL(/\/workout\/strength\//)
  507 |     await page.locator('button').first().click()
  508 |     await expect(page).toHaveURL(new RegExp(`/workout\\?week=${testData.testWeek}`))
  509 |     await expect(page.getByText('Training Week')).toBeVisible()
  510 |   })
  511 | 
  512 |   test('back chevron opened directly with no prior history goes to /workout', async ({ page }) => {
  513 |     // Simulate "open in new tab" — navigate directly to the workout URL with no prior history
  514 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  515 |     await page.waitForLoadState('networkidle')
  516 |     await page.locator('button').first().click()
  517 |     await expect(page).toHaveURL(/\/workout(\?|$)/)
  518 |     await expect(page.getByText('Training Week')).toBeVisible()
  519 |   })
  520 | })
  521 | 
  522 | // ─── Workout notes ────────────────────────────────────────────────────────────
  523 | 
  524 | test.describe('Workout notes', () => {
  525 |   test.beforeEach(async ({ request }) => {
  526 |     await uncompleteWorkout(request, testData.strengthWorkoutId)
  527 |     await request.post(GQL, {
  528 |       data: { query: `mutation { updateWorkoutNotes(workoutId: "${testData.strengthWorkoutId}", notes: "Strength A") { id } }` },
  529 |     })
  530 |   })
  531 | 
  532 |   test('notes save on blur when workout is incomplete', async ({ page }) => {
> 533 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  534 |     await page.waitForLoadState('networkidle')
  535 | 
  536 |     const notes = page.getByPlaceholder('Add a note for this workout…')
  537 |     await notes.fill('Feeling strong today')
  538 |     await notes.blur()
  539 |     await page.waitForTimeout(500)
  540 | 
  541 |     await page.reload()
  542 |     await page.waitForLoadState('networkidle')
  543 |     await expect(notes).toHaveValue('Feeling strong today')
  544 |   })
  545 | 
  546 |   test('notes save on blur even when workout is already complete', async ({ page, request }) => {
  547 |     await request.post(GQL, {
  548 |       data: { query: `mutation { completeWorkout(workoutId: "${testData.strengthWorkoutId}") { id } }` },
  549 |     })
  550 | 
  551 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  552 |     await page.waitForLoadState('networkidle')
  553 |     await expect(page.getByText('✓ WORKOUT COMPLETE')).toBeVisible()
  554 | 
  555 |     const notes = page.getByPlaceholder('Add a note for this workout…')
  556 |     await notes.fill('PR on squats!')
  557 |     await notes.blur()
  558 |     await page.waitForTimeout(500)
  559 | 
  560 |     await page.reload()
  561 |     await page.waitForLoadState('networkidle')
  562 |     await expect(notes).toHaveValue('PR on squats!')
  563 |   })
  564 | })
  565 | 
  566 | // ─── Strength workout: set completion toggle ──────────────────────────────────
  567 | 
  568 | test.describe('Strength workout: set completion toggle', () => {
  569 |   // Serial mode prevents the three tests from racing each other within a single browser run.
  570 |   test.describe.configure({ mode: 'serial' })
  571 | 
  572 |   test.beforeEach(async ({ request }) => {
  573 |     await uncompleteWorkout(request, testData.strengthWorkoutId)
  574 |     // Reset secondSetId by its stable DB ID — unaffected by other tests deleting/adding sets.
  575 |     await request.post(GQL, {
  576 |       data: { query: `mutation { uncompleteSet(setId: "${testData.secondSetId}") { id } }` },
  577 |     })
  578 |   })
  579 | 
  580 |   test('completing a set disables its inputs', async ({ page }) => {
  581 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  582 |     await page.waitForLoadState('networkidle')
  583 | 
  584 |     // Use data-set-id (the DB primary key) — globally unique, survives other sets being deleted.
  585 |     const setRow = page.locator(`[data-set-id="${testData.secondSetId}"]`)
  586 |     const repsInput = setRow.locator('input').nth(0)
  587 | 
  588 |     await expect(repsInput).toBeEnabled()
  589 | 
  590 |     await setRow.locator('button').filter({
  591 |       has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
  592 |     }).click()
  593 | 
  594 |     await expect(repsInput).toBeDisabled()
  595 |   })
  596 | 
  597 |   test('tapping a completed checkmark re-enables the set inputs', async ({ page }) => {
  598 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  599 |     await page.waitForLoadState('networkidle')
  600 | 
  601 |     const setRow = page.locator(`[data-set-id="${testData.secondSetId}"]`)
  602 |     const checkmark = setRow.locator('button').filter({
  603 |       has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
  604 |     })
  605 |     const repsInput = setRow.locator('input').nth(0)
  606 |     const lbsInput = setRow.locator('input').nth(1)
  607 |     const rpeInput = setRow.locator('input').nth(2)
  608 | 
  609 |     await checkmark.click()
  610 |     await expect(repsInput).toBeDisabled()
  611 | 
  612 |     // Tap again to un-complete
  613 |     await checkmark.click()
  614 |     await expect(repsInput).toBeEnabled()
  615 |     await expect(lbsInput).toBeEnabled()
  616 |     await expect(rpeInput).toBeEnabled()
  617 |   })
  618 | 
  619 |   test('reps, weight, and RPE can all be edited after un-completing a set', async ({ page }) => {
  620 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  621 |     await page.waitForLoadState('networkidle')
  622 | 
  623 |     const setRow = page.locator(`[data-set-id="${testData.secondSetId}"]`)
  624 |     const checkmark = setRow.locator('button').filter({
  625 |       has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
  626 |     })
  627 |     const repsInput = setRow.locator('input').nth(0)
  628 | 
  629 |     // Complete then un-complete
  630 |     await checkmark.click()
  631 |     await expect(repsInput).toBeDisabled()
  632 |     await checkmark.click()
  633 |     await expect(repsInput).toBeEnabled()
```