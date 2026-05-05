# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Strength workout: log actuals and complete >> completing the workout navigates back and shows complete badge
- Location: e2e/tests/workout.spec.ts:340:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/workout?week=2020-01-13", waiting until "load"

```

# Test source

```ts
  242 |   })
  243 | 
  244 |   test('editing target RPE updates the displayed value', async ({ page }) => {
  245 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  246 |     await page.waitForLoadState('networkidle')
  247 |     await page.locator('button').nth(1).click()
  248 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  249 | 
  250 |     await page.getByText('RPE').first().click()
  251 |     // Spec input is first in DOM (top row before PillInputs in bottom row)
  252 |     const specInput = page.locator('input').first()
  253 |     await specInput.fill('8')
  254 |     await page.keyboard.press('Enter')
  255 | 
  256 |     await expect(page.getByText('8').first()).toBeVisible()
  257 | 
  258 |     // Restore
  259 |     await page.getByText('RPE').first().click()
  260 |     await page.locator('input').first().fill('7')
  261 |     await page.keyboard.press('Enter')
  262 |   })
  263 | 
  264 |   test('Add Set button appends a new set to an exercise', async ({ page }) => {
  265 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  266 |     await page.waitForLoadState('networkidle')
  267 |     await page.locator('button').nth(1).click()
  268 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  269 | 
  270 |     // Scope to just the Barbell Squat exercise card — isolates from concurrent cross-project
  271 |     // mutations on other exercises or set counts.
  272 |     const squatCard = page.locator('[data-exercise-name="Barbell Squat"]')
  273 |     const inputsBefore = await squatCard.locator('input').count()
  274 | 
  275 |     await squatCard.getByRole('button', { name: /Add Set/ }).click()
  276 |     await expect(squatCard.locator('input')).toHaveCount(inputsBefore + 3)
  277 |   })
  278 | 
  279 |   test('trash icon removes a set from an exercise', async ({ page }) => {
  280 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  281 |     await page.waitForLoadState('networkidle')
  282 |     await page.locator('button').nth(1).click()
  283 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  284 | 
  285 |     // Scope to firstSetId's row — resilient to concurrent set mutations by other browser projects.
  286 |     const set1Row = page.locator(`[data-set-id="${testData.firstSetId}"]`)
  287 |     await expect(set1Row).toBeVisible()
  288 | 
  289 |     // The trash button lives inside the set row
  290 |     await set1Row.locator('button').click()
  291 |     await expect(set1Row).not.toBeVisible()
  292 |   })
  293 | })
  294 | 
  295 | // ─── Strength workout: log actuals and complete ───────────────────────────────
  296 | 
  297 | test.describe('Strength workout: log actuals and complete', () => {
  298 |   test.beforeEach(async ({ request }) => {
  299 |     await uncompleteWorkout(request, testData.strengthWorkoutId)
  300 |   })
  301 | 
  302 |   test('entering values in pill inputs saves actuals', async ({ page }) => {
  303 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  304 |     await page.waitForLoadState('networkidle')
  305 | 
  306 |     // index 0 = REPS input for SET 1 of Barbell Squat
  307 |     await page.locator('input').nth(0).fill('8')
  308 |     // index 1 = LBS input
  309 |     await page.locator('input').nth(1).fill('135')
  310 | 
  311 |     // Wait for debounce to fire (500ms)
  312 |     await page.waitForTimeout(600)
  313 |     // If no error thrown, the mutation succeeded
  314 |   })
  315 | 
  316 |   test('clicking checkmark marks a set complete and updates progress', async ({ page }) => {
  317 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  318 |     await page.waitForLoadState('networkidle')
  319 | 
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
> 342 |     await page.goto(`/workout?week=${testData.testWeek}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
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
  420 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
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
```