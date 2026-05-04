# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Yoga day >> MARK INCOMPLETE on yoga day reverts to complete button
- Location: e2e/tests/workout.spec.ts:512:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/workout/yoga/cmoqhofqa000rlrmf59z7np3g", waiting until "load"

```

# Test source

```ts
  413 |       data: {
  414 |         query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
  415 |       },
  416 |     })
  417 | 
  418 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  419 |     await page.waitForLoadState('networkidle')
  420 |     await expect(page.getByText('How it went')).toBeVisible()
  421 |     await expect(page.getByRole('button', { name: 'Edit Run' })).toBeVisible()
  422 |     await expect(page.getByRole('button', { name: 'Mark Incomplete' })).toBeVisible()
  423 |   })
  424 | 
  425 |   test('Edit Run switches back to form mode', async ({ page, request }) => {
  426 |     // Pre-complete the run
  427 |     await request.post(GQL, {
  428 |       data: {
  429 |         query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
  430 |       },
  431 |     })
  432 | 
  433 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  434 |     await page.waitForLoadState('networkidle')
  435 |     await expect(page.getByText('How it went')).toBeVisible()
  436 | 
  437 |     await page.getByRole('button', { name: 'Edit Run' }).click()
  438 |     await expect(page.getByRole('button', { name: /Save Changes/ })).toBeVisible()
  439 |   })
  440 | 
  441 |   test('Mark Incomplete on completed run returns to entry form', async ({ page, request }) => {
  442 |     await request.post(GQL, {
  443 |       data: {
  444 |         query: `mutation { logRunWorkout(workoutId: "${testData.runWorkoutId}", actualMiles: 3.5, actualTime: 1950) { id } }`,
  445 |       },
  446 |     })
  447 | 
  448 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  449 |     await page.waitForLoadState('networkidle')
  450 |     await expect(page.getByText('How it went')).toBeVisible()
  451 | 
  452 |     await page.getByRole('button', { name: 'Mark Incomplete' }).click()
  453 |     await expect(page.getByText('Log your run')).toBeVisible()
  454 |   })
  455 | })
  456 | 
  457 | // ─── Rest day ─────────────────────────────────────────────────────────────────
  458 | 
  459 | test.describe('Rest day', () => {
  460 |   test.beforeEach(async ({ request }) => {
  461 |     await uncompleteWorkout(request, testData.restWorkoutId)
  462 |   })
  463 | 
  464 |   test('shows Mark Day Complete button when not complete', async ({ page }) => {
  465 |     await page.goto(`/workout/rest/${testData.restWorkoutId}`)
  466 |     await page.waitForLoadState('networkidle')
  467 |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  468 |   })
  469 | 
  470 |   test('clicking Mark Day Complete shows completion banner', async ({ page }) => {
  471 |     await page.goto(`/workout/rest/${testData.restWorkoutId}`)
  472 |     await page.waitForLoadState('networkidle')
  473 |     await page.getByRole('button', { name: 'Mark Day Complete' }).click()
  474 |     await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
  475 |     await expect(page.getByText('MARK INCOMPLETE')).toBeVisible()
  476 |   })
  477 | 
  478 |   test('MARK INCOMPLETE on rest day reverts to complete button', async ({ page }) => {
  479 |     await page.goto(`/workout/rest/${testData.restWorkoutId}`)
  480 |     await page.waitForLoadState('networkidle')
  481 |     await page.getByRole('button', { name: 'Mark Day Complete' }).click()
  482 |     await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
  483 | 
  484 |     await page.getByText('MARK INCOMPLETE').click()
  485 |     await expect(page.getByText('✓ DAY COMPLETE')).not.toBeVisible()
  486 |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  487 |   })
  488 | })
  489 | 
  490 | // ─── Yoga day ─────────────────────────────────────────────────────────────────
  491 | 
  492 | test.describe('Yoga day', () => {
  493 |   test.beforeEach(async ({ request }) => {
  494 |     await uncompleteWorkout(request, testData.yogaWorkoutId)
  495 |   })
  496 | 
  497 |   test('shows Mark Day Complete button when not complete', async ({ page }) => {
  498 |     await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
  499 |     await page.waitForLoadState('networkidle')
  500 |     await expect(page.getByText('Yoga.')).toBeVisible()
  501 |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  502 |   })
  503 | 
  504 |   test('clicking Mark Day Complete shows completion banner', async ({ page }) => {
  505 |     await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
  506 |     await page.waitForLoadState('networkidle')
  507 |     await page.getByRole('button', { name: 'Mark Day Complete' }).click()
  508 |     await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
  509 |     await expect(page.getByText('MARK INCOMPLETE')).toBeVisible()
  510 |   })
  511 | 
  512 |   test('MARK INCOMPLETE on yoga day reverts to complete button', async ({ page }) => {
> 513 |     await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  514 |     await page.waitForLoadState('networkidle')
  515 |     await page.getByRole('button', { name: 'Mark Day Complete' }).click()
  516 |     await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
  517 | 
  518 |     await page.getByText('MARK INCOMPLETE').click()
  519 |     await expect(page.getByText('✓ DAY COMPLETE')).not.toBeVisible()
  520 |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  521 |   })
  522 | })
  523 | 
```