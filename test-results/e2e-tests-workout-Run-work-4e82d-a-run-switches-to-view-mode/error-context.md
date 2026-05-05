# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Run workout >> logging a run switches to view mode
- Location: e2e/tests/workout.spec.ts:411:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/workout/run/cmortljrt000llr99qm0qmou0", waiting until "load"

```

# Test source

```ts
  320 |     // Progress shows "0/N" initially
  321 |     const progressText = page.getByText(/^0\//)
  322 |     await expect(progressText).toBeVisible()
  323 | 
  324 |     // Complete SET 1 — the checkmark button with the unique SVG path
  325 |     const completeButtons = page.locator('button').filter({
  326 |       has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
  327 |     })
  328 |     await completeButtons.first().click()
  329 | 
  330 |     // Progress should now show "1/N"
  331 |     await expect(page.getByText(/^1\//)).toBeVisible()
  332 |   })
  333 | 
  334 |   test('complete workout button is visible when not complete', async ({ page }) => {
  335 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  336 |     await page.waitForLoadState('networkidle')
  337 |     await expect(page.getByRole('button', { name: /Mark Workout Complete|Finish/ })).toBeVisible()
  338 |   })
  339 | 
  340 |   test('completing the workout navigates back and shows complete badge', async ({ page }) => {
  341 |     // Navigate from calendar to establish browser history for navigate(-1)
  342 |     await page.goto(`/workout?week=${testData.testWeek}`)
  343 |     await page.getByText('Strength A').click()
  344 |     await expect(page).toHaveURL(/\/workout\/strength\//)
  345 | 
  346 |     await page.getByRole('button', { name: /Mark Workout Complete|Finish/ }).click()
  347 |     // Confirmation sheet opens
  348 |     await expect(page.getByText('Mark workout complete?')).toBeVisible()
  349 |     await page.getByRole('button', { name: 'Mark Complete' }).click()
  350 | 
  351 |     // Navigates back to weekly calendar
  352 |     await expect(page).toHaveURL(/\/workout(\?|$)/)
  353 |     await expect(page.getByText('✓ COMPLETE').first()).toBeVisible()
  354 |   })
  355 | 
  356 |   test('marking a completed strength workout incomplete clears the banner', async ({ page, request }) => {
  357 |     // First complete the workout via API
  358 |     await request.post(GQL, {
  359 |       data: { query: `mutation { completeWorkout(workoutId: "${testData.strengthWorkoutId}") { id } }` },
  360 |     })
  361 | 
  362 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  363 |     await page.waitForLoadState('networkidle')
  364 | 
  365 |     await expect(page.getByText('✓ WORKOUT COMPLETE')).toBeVisible()
  366 |     await page.getByText('MARK INCOMPLETE').click()
  367 | 
  368 |     await expect(page.getByText('✓ WORKOUT COMPLETE')).not.toBeVisible()
  369 |     await expect(page.getByText('SETS LOGGED')).toBeVisible()
  370 |   })
  371 | })
  372 | 
  373 | // ─── Run workout ──────────────────────────────────────────────────────────────
  374 | 
  375 | test.describe('Run workout', () => {
  376 |   test.beforeEach(async ({ request }) => {
  377 |     await uncompleteWorkout(request, testData.runWorkoutId)
  378 |   })
  379 | 
  380 |   test('shows prescribed targets', async ({ page }) => {
  381 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  382 |     await page.waitForLoadState('networkidle')
  383 |     await expect(page.getByText('PRESCRIBED')).toBeVisible()
  384 |     await expect(page.getByText('9:30')).toBeVisible() // target pace — unique value on this page
  385 |   })
  386 | 
  387 |   test('shows Log your run heading when not complete', async ({ page }) => {
  388 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  389 |     await page.waitForLoadState('networkidle')
  390 |     await expect(page.getByText('Log your run')).toBeVisible()
  391 |     await expect(page.getByRole('button', { name: /Distance & Time required|Log Run/ })).toBeVisible()
  392 |   })
  393 | 
  394 |   test('Log Run button is disabled until distance and time are filled', async ({ page }) => {
  395 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  396 |     await page.waitForLoadState('networkidle')
  397 | 
  398 |     const logBtn = page.getByRole('button', { name: /Distance & Time required/ })
  399 |     await expect(logBtn).toBeDisabled()
  400 | 
  401 |     // Fill distance only — still disabled
  402 |     await page.locator('input').nth(0).fill('3.5')
  403 |     await expect(page.getByRole('button', { name: /Distance & Time required/ })).toBeDisabled()
  404 | 
  405 |     // Fill time — button becomes enabled
  406 |     await page.locator('input').nth(1).click()
  407 |     await page.locator('input').nth(1).pressSequentially('3230')
  408 |     await expect(page.getByRole('button', { name: 'Log Run' })).toBeEnabled()
  409 |   })
  410 | 
  411 |   test('logging a run switches to view mode', async ({ page, request }) => {
  412 |     // Pre-log via API — the UI form calls navigate(-1) immediately after logging,
  413 |     // so view mode is only reachable by navigating to an already-completed run
  414 |     await request.post(GQL, {
  415 |       data: {
  416 |         query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
  417 |       },
  418 |     })
  419 | 
> 420 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  421 |     await page.waitForLoadState('networkidle')
  422 |     await expect(page.getByText('How it went')).toBeVisible()
  423 |     await expect(page.getByRole('button', { name: 'Edit Run' })).toBeVisible()
  424 |     await expect(page.getByRole('button', { name: 'Mark Incomplete' })).toBeVisible()
  425 |   })
  426 | 
  427 |   test('Edit Run switches back to form mode', async ({ page, request }) => {
  428 |     // Pre-complete the run
  429 |     await request.post(GQL, {
  430 |       data: {
  431 |         query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
  432 |       },
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
```