# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/workout.spec.ts >> Strength workout: edit fields >> clicking REPS target in edit mode opens inline input
- Location: e2e/tests/workout.spec.ts:191:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/workout/strength/cmoqhofq20003lrmftzqlf4ym", waiting until "load"

```

# Test source

```ts
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
  177 | 
  178 |     const nameInput = page.getByRole('textbox').last()
  179 |     await nameInput.fill('Back Squat')
  180 |     await page.getByRole('button', { name: 'Save' }).click()
  181 | 
  182 |     await expect(page.getByText('Back Squat')).toBeVisible()
  183 |     await expect(page.getByText('Barbell Squat')).not.toBeVisible()
  184 | 
  185 |     // Restore original name
  186 |     await page.getByText('Back Squat').click()
  187 |     await page.getByRole('textbox').last().fill('Barbell Squat')
  188 |     await page.getByRole('button', { name: 'Save' }).click()
  189 |   })
  190 | 
  191 |   test('clicking REPS target in edit mode opens inline input', async ({ page }) => {
> 192 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  193 |     await page.waitForLoadState('networkidle')
  194 |     await page.locator('button').nth(1).click() // enter edit mode
  195 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  196 | 
  197 |     await page.getByText('REPS').first().click()
  198 |     // Spec input appears in the top row — first in DOM order, before PillInputs
  199 |     await expect(page.locator('input').first()).toBeVisible()
  200 |   })
  201 | 
  202 |   test('editing target reps updates the displayed value', async ({ page }) => {
  203 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  204 |     await page.waitForLoadState('networkidle')
  205 |     await page.locator('button').nth(1).click()
  206 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  207 | 
  208 |     await page.getByText('REPS').first().click()
  209 |     // Spec input is first in DOM (top row before PillInputs in bottom row)
  210 |     const specInput = page.locator('input').first()
  211 |     await specInput.fill('12')
  212 |     await page.keyboard.press('Enter')
  213 | 
  214 |     await expect(page.getByText('12').first()).toBeVisible()
  215 | 
  216 |     // Restore to original
  217 |     await page.getByText('REPS').first().click()
  218 |     await page.locator('input').first().fill('8')
  219 |     await page.keyboard.press('Enter')
  220 |   })
  221 | 
  222 |   test('editing target weight updates the displayed value', async ({ page }) => {
  223 |     await page.goto(`/workout/strength/${testData.strengthWorkoutId}`)
  224 |     await page.waitForLoadState('networkidle')
  225 |     await page.locator('button').nth(1).click()
  226 |     await expect(page.getByText('EDITING PLAN')).toBeVisible()
  227 | 
  228 |     await page.getByText('LBS').first().click()
  229 |     // Spec input is first in DOM (top row before PillInputs in bottom row)
  230 |     const specInput = page.locator('input').first()
  231 |     await specInput.fill('145')
  232 |     await page.keyboard.press('Enter')
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
```