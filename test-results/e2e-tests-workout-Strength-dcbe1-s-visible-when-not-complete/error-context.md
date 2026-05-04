# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Strength workout: log actuals and complete >> complete workout button is visible when not complete
- Location: e2e/tests/workout.spec.ts:332:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/workout/strength/cmoqhofq20003lrmftzqlf4ym", waiting until "load"

```

# Test source

```ts
  233 | 
  234 |     await expect(page.getByText('145').first()).toBeVisible()
  235 | 
  236 |     // Restore
  237 |     await page.getByText('LBS').first().click()
  238 |     await page.locator('input').first().fill('135')
  239 |     await page.keyboard.press('Enter')
  240 |   })
  241 | 
  242 |   test('editing target RPE updates the displayed value', async ({ page }) => {
  243 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  244 |     await page.waitForLoadState('networkidle')
  245 |     await page.locator('button').nth(1).click()
  246 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  247 | 
  248 |     await page.getByText('RPE').first().click()
  249 |     // Spec input is first in DOM (top row before PillInputs in bottom row)
  250 |     const specInput = page.locator('input').first()
  251 |     await specInput.fill('8')
  252 |     await page.keyboard.press('Enter')
  253 | 
  254 |     await expect(page.getByText('8').first()).toBeVisible()
  255 | 
  256 |     // Restore
  257 |     await page.getByText('RPE').first().click()
  258 |     await page.locator('input').first().fill('7')
  259 |     await page.keyboard.press('Enter')
  260 |   })
  261 | 
  262 |   test('Add Set button appends a new set to an exercise', async ({ page }) => {
  263 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  264 |     await page.waitForLoadState('networkidle')
  265 |     await page.locator('button').nth(1).click()
  266 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  267 | 
  268 |     // Count PillInputs before (2 exercises × 3 sets × 3 pill inputs = 18)
  269 |     const inputsBefore = await page.locator('input').count()
  270 | 
  271 |     await page.getByRole('button', { name: /Add Set/ }).first().click()
  272 |     // Wait for the new row's PillInputs to appear in DOM (+3 inputs)
  273 |     await expect(page.locator('input')).toHaveCount(inputsBefore + 3)
  274 |   })
  275 | 
  276 |   test('trash icon removes a set from an exercise', async ({ page }) => {
  277 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  278 |     await page.waitForLoadState('networkidle')
  279 |     await page.locator('button').nth(1).click()
  280 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  281 | 
  282 |     const inputsBefore = await page.locator('input').count()
  283 | 
  284 |     // In edit mode: btn 0=back, btn 1=pencil, btn 2=trash-SET1
  285 |     await page.locator('button').nth(2).click()
  286 |     await page.waitForLoadState('networkidle')
  287 | 
  288 |     const inputsAfter = await page.locator('input').count()
  289 |     expect(inputsAfter).toBe(inputsBefore - 3) // removed 1 set = 3 fewer pill inputs
  290 |   })
  291 | })
  292 | 
  293 | // ─── Strength workout: log actuals and complete ───────────────────────────────
  294 | 
  295 | test.describe('Strength workout: log actuals and complete', () => {
  296 |   test.beforeEach(async ({ request }) => {
  297 |     await uncompleteWorkout(request, testData.strengthWorkoutId)
  298 |   })
  299 | 
  300 |   test('entering values in pill inputs saves actuals', async ({ page }) => {
  301 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  302 |     await page.waitForLoadState('networkidle')
  303 | 
  304 |     // index 0 = REPS input for SET 1 of Barbell Squat
  305 |     await page.locator('input').nth(0).fill('8')
  306 |     // index 1 = LBS input
  307 |     await page.locator('input').nth(1).fill('135')
  308 | 
  309 |     // Wait for debounce to fire (500ms)
  310 |     await page.waitForTimeout(600)
  311 |     // If no error thrown, the mutation succeeded
  312 |   })
  313 | 
  314 |   test('clicking checkmark marks a set complete and updates progress', async ({ page }) => {
  315 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  316 |     await page.waitForLoadState('networkidle')
  317 | 
  318 |     // Progress shows "0/N" initially
  319 |     const progressText = page.getByText(/^0\//)
  320 |     await expect(progressText).toBeVisible()
  321 | 
  322 |     // Complete SET 1 — the checkmark button with the unique SVG path
  323 |     const completeButtons = page.locator('button').filter({
  324 |       has: page.locator('path[d="M3 8.5L6.5 12L13 4.5"]'),
  325 |     })
  326 |     await completeButtons.first().click()
  327 | 
  328 |     // Progress should now show "1/N"
  329 |     await expect(page.getByText(/^1\//)).toBeVisible()
  330 |   })
  331 | 
  332 |   test('complete workout button is visible when not complete', async ({ page }) => {
> 333 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  334 |     await page.waitForLoadState('networkidle')
  335 |     await expect(page.getByRole('button', { name: /Mark Workout Complete|Finish/ })).toBeVisible()
  336 |   })
  337 | 
  338 |   test('completing the workout navigates back and shows complete badge', async ({ page }) => {
  339 |     // Navigate from calendar to establish browser history for navigate(-1)
  340 |     await page.goto(`/workout?week=${testData.testWeek}`)
  341 |     await page.getByText('Strength A').click()
  342 |     await expect(page).toHaveURL(/\/workout\/strength\//)
  343 | 
  344 |     await page.getByRole('button', { name: /Mark Workout Complete|Finish/ }).click()
  345 |     // Confirmation sheet opens
  346 |     await expect(page.getByText('Mark workout complete?')).toBeVisible()
  347 |     await page.getByRole('button', { name: 'Mark Complete' }).click()
  348 | 
  349 |     // Navigates back to weekly calendar
  350 |     await expect(page).toHaveURL(/\/workout(\?|$)/)
  351 |     await expect(page.getByText('✓ COMPLETE').first()).toBeVisible()
  352 |   })
  353 | 
  354 |   test('marking a completed strength workout incomplete clears the banner', async ({ page, request }) => {
  355 |     // First complete the workout via API
  356 |     await request.post(GQL, {
  357 |       data: { query: `mutation { completeWorkout(workoutId: "${testData.strengthWorkoutId}") { id } }` },
  358 |     })
  359 | 
  360 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  361 |     await page.waitForLoadState('networkidle')
  362 | 
  363 |     await expect(page.getByText('✓ WORKOUT COMPLETE')).toBeVisible()
  364 |     await page.getByText('MARK INCOMPLETE').click()
  365 | 
  366 |     await expect(page.getByText('✓ WORKOUT COMPLETE')).not.toBeVisible()
  367 |     await expect(page.getByText('SETS LOGGED')).toBeVisible()
  368 |   })
  369 | })
  370 | 
  371 | // ─── Run workout ──────────────────────────────────────────────────────────────
  372 | 
  373 | test.describe('Run workout', () => {
  374 |   test.beforeEach(async ({ request }) => {
  375 |     await uncompleteWorkout(request, testData.runWorkoutId)
  376 |   })
  377 | 
  378 |   test('shows prescribed targets', async ({ page }) => {
  379 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  380 |     await page.waitForLoadState('networkidle')
  381 |     await expect(page.getByText('PRESCRIBED')).toBeVisible()
  382 |     await expect(page.getByText('9:30')).toBeVisible() // target pace — unique value on this page
  383 |   })
  384 | 
  385 |   test('shows Log your run heading when not complete', async ({ page }) => {
  386 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  387 |     await page.waitForLoadState('networkidle')
  388 |     await expect(page.getByText('Log your run')).toBeVisible()
  389 |     await expect(page.getByRole('button', { name: /Distance & Time required|Log Run/ })).toBeVisible()
  390 |   })
  391 | 
  392 |   test('Log Run button is disabled until distance and time are filled', async ({ page }) => {
  393 |     await page.goto(`/workout/run/${testData.runWorkoutId}`)
  394 |     await page.waitForLoadState('networkidle')
  395 | 
  396 |     const logBtn = page.getByRole('button', { name: /Distance & Time required/ })
  397 |     await expect(logBtn).toBeDisabled()
  398 | 
  399 |     // Fill distance only — still disabled
  400 |     await page.locator('input').nth(0).fill('3.5')
  401 |     await expect(page.getByRole('button', { name: /Distance & Time required/ })).toBeDisabled()
  402 | 
  403 |     // Fill time — button becomes enabled
  404 |     await page.locator('input').nth(1).click()
  405 |     await page.locator('input').nth(1).pressSequentially('3230')
  406 |     await expect(page.getByRole('button', { name: 'Log Run' })).toBeEnabled()
  407 |   })
  408 | 
  409 |   test('logging a run switches to view mode', async ({ page, request }) => {
  410 |     // Pre-log via API — the UI form calls navigate(-1) immediately after logging,
  411 |     // so view mode is only reachable by navigating to an already-completed run
  412 |     await request.post(GQL, {
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
```