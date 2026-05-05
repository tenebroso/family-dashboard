# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Yoga day >> MARK INCOMPLETE on yoga day reverts to complete button
- Location: e2e/tests/workout.spec.ts:669:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/workout/yoga/cmortljry000rlr9936x5i5ea", waiting until "load"

```

# Test source

```ts
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
  634 | 
  635 |     // Edit all three actuals
  636 |     await setRow.locator('input').nth(0).fill('10')
  637 |     await setRow.locator('input').nth(1).fill('140')
  638 |     await setRow.locator('input').nth(2).fill('8')
  639 |     await page.waitForTimeout(600) // debounce
  640 | 
  641 |     // Re-complete and confirm it locks again
  642 |     await checkmark.click()
  643 |     await expect(repsInput).toBeDisabled()
  644 |   })
  645 | })
  646 | 
  647 | // ─── Yoga day ─────────────────────────────────────────────────────────────────
  648 | 
  649 | test.describe('Yoga day', () => {
  650 |   test.beforeEach(async ({ request }) => {
  651 |     await uncompleteWorkout(request, testData.yogaWorkoutId)
  652 |   })
  653 | 
  654 |   test('shows Mark Day Complete button when not complete', async ({ page }) => {
  655 |     await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
  656 |     await page.waitForLoadState('networkidle')
  657 |     await expect(page.getByText('Yoga.')).toBeVisible()
  658 |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  659 |   })
  660 | 
  661 |   test('clicking Mark Day Complete shows completion banner', async ({ page }) => {
  662 |     await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
  663 |     await page.waitForLoadState('networkidle')
  664 |     await page.getByRole('button', { name: 'Mark Day Complete' }).click()
  665 |     await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
  666 |     await expect(page.getByText('MARK INCOMPLETE')).toBeVisible()
  667 |   })
  668 | 
  669 |   test('MARK INCOMPLETE on yoga day reverts to complete button', async ({ page }) => {
> 670 |     await page.goto(`/workout/yoga/${testData.yogaWorkoutId}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  671 |     await page.waitForLoadState('networkidle')
  672 |     await page.getByRole('button', { name: 'Mark Day Complete' }).click()
  673 |     await expect(page.getByText('✓ DAY COMPLETE')).toBeVisible()
  674 | 
  675 |     await page.getByText('MARK INCOMPLETE').click()
  676 |     await expect(page.getByText('✓ DAY COMPLETE')).not.toBeVisible()
  677 |     await expect(page.getByRole('button', { name: 'Mark Day Complete' })).toBeVisible()
  678 |   })
  679 | })
  680 | 
```