# Workout Tracking Implementation Plan (Backend-Focused)

## Overview

Integrate workout tracking into family-dashboard with:
- **Complete backend implementation** (database, services, GraphQL API)
- **Simple read-only UI** (verify parsing works, no logging yet)
- **Easy to extend** (logging UI can be added later)

**Key Constraints:**
- Reuse existing Pi/SQLite/Apollo setup
- Domain-isolated (can extract later)
- Cloudflare tunnel compatible
- Reuse existing Google OAuth auth
- PDF parsing via Claude API vision

**Stack:** TypeScript, Node.js, Prisma, Apollo Server, React, GraphQL

---

## Architecture Decision: Combined with Separation

**Database:** Extend existing SQLite (one Prisma schema)
**API:** Add new resolvers + schema to existing Apollo Server
**Frontend:** New React route (`/jon/workouts`) in existing React Router
**Auth:** Inherit existing Google OAuth (personId-based)
**Services:** Isolated in `server/src/services/` (extraction-ready)

---

## Implementation Steps

### Phase 1: Database Schema (Prisma)

**File to modify:** `server/prisma/schema.prisma`

Add these 6 new models at the end (before closing brace):

```
Athlete
  - id (cuid, PK)
  - personId (String, FK to Person, unique)
  - person (Person relation, onDelete Cascade)
  - trainingWeek (TrainingWeek relation, one-to-one)
  - createdAt

TrainingWeek
  - id (cuid, PK)
  - athleteId (String, FK to Athlete, unique)
  - athlete (Athlete relation, onDelete Cascade)
  - weekOf (String) // "2025-04-28" — Monday of training week
  - pdfUrl (String, optional)
  - workouts (Workout[] relation)
  - createdAt, updatedAt
  - @@unique([athleteId, weekOf])

Workout
  - id (cuid, PK)
  - trainingWeekId (String, FK to TrainingWeek, onDelete Cascade)
  - trainingWeek (TrainingWeek relation)
  - date (String) // "2025-04-28" — actual date
  - dayOfWeek (Int) // 0=Monday, 1=Tuesday, etc.
  - type (String) // "strength" | "run" | "recovery"
  - exercises (StrengthExercise[] relation)
  - runWorkout (RunWorkout? relation)
  - notes (String, optional)
  - completedAt (DateTime, optional)
  - createdAt, updatedAt

StrengthExercise
  - id (cuid, PK)
  - workoutId (String, FK to Workout, onDelete Cascade)
  - workout (Workout relation)
  - name (String) // "Split Stance Deadlift"
  - section (String) // "Strength Intensity 1", "Strength Balance", "Finisher"
  - order (Int)
  - sets (StrengthSet[] relation)
  - createdAt

StrengthSet
  - id (cuid, PK)
  - exerciseId (String, FK to StrengthExercise, onDelete Cascade)
  - exercise (StrengthExercise relation)
  - setNumber (Int)
  - targetReps (String, optional) // "6", "6-8", "Max Unbroken reps"
  - targetWeight (Float, optional)
  - targetRPE (String, optional) // "7", "8", "9", "9+"
  - tempo (String, optional) // "21X1"
  - actualReps (String, optional)
  - actualWeight (Float, optional)
  - actualRPE (String, optional)
  - notes (String, optional)
  - completed (Boolean, default: false)
  - completedAt (DateTime, optional)

RunWorkout
  - id (cuid, PK)
  - workoutId (String, FK to Workout, unique, onDelete Cascade)
  - workout (Workout relation)
  - targetMiles (Float, optional)
  - targetPace (String, optional) // "8:30/mi"
  - heartRateZone (String, optional)
  - actualMiles (Float, optional)
  - actualTime (Int, optional) // seconds
  - avgHeartRate (Int, optional)
  - maxHeartRate (Int, optional)
  - notes (String, optional)
  - completed (Boolean, default: false)
  - completedAt (DateTime, optional)
```

Also update the Person model to add:
```
athlete (Athlete? relation)
```

Run migration:
```bash
npx prisma migrate dev --name add_workouts
```

---

### Phase 2: PDF Parsing Service

**Create new file:** `server/src/services/workoutParsing.ts`

This service:
1. Reads PDF file as base64
2. Sends to Claude API with vision capability
3. Parses response as JSON
4. Returns structured workout data

**Function signatures:**

```typescript
export async function parsePersistPDF(
  pdfPath: string,
  programTrack: string = "Pump Lift 3x"
): Promise<ParsedWorkout[]>
```

Input: local file path, program track name (e.g., "Pump Lift 3x")
Output: Array of parsed workouts with exercises and sets

```typescript
export function getWorkoutDate(
  weekOf: string,
  dayName: string
): { dayOfWeek: number; date: string }
```

Input: weekOf date string, day name (e.g., "Monday")
Output: dayOfWeek (0-6) and ISO date string

**Claude API call:**
- Model: `claude-opus-4-1`
- Max tokens: 4000
- Input: PDF (base64), program track name
- Output: JSON with structure:
  ```json
  {
    "workouts": [
      {
        "dayOfWeek": 0,
        "dayName": "Monday",
        "exercises": [
          {
            "name": "Split Stance Deadlift",
            "section": "Strength Intensity 1",
            "targetSets": 3,
            "sets": [
              {
                "setNumber": 1,
                "targetReps": "6",
                "targetWeight": null,
                "targetRPE": "7",
                "tempo": "21X1"
              }
            ]
          }
        ]
      }
    ]
  }
  ```

**Parsing rules:**
- Extract ONLY Monday, Wednesday, Friday from Pump Lift 3x
- Include these sections: Warmup, Strength Intensity 1, Loading Note, Strength Intensity 2, Loading Note, Strength Balance, Loading Note, Finisher, Cooldown.
- Exclude: loading notes, optional sections
- targetReps can be: "6", "6-8", "Max Unbroken reps", "Max reps"
- targetRPE can be: "7", "8", "9", "9+", "7-8", "8-9"
- tempo format: "21X1" (2 down, 1 pause, X no pause, 1 up)

---

### Phase 3: GraphQL Schema

**Create new file:** `server/src/schema/workouts.graphql`

Define these types:

```graphql
type StrengthSet {
  id: String!
  setNumber: Int!
  targetReps: String
  targetWeight: Float
  targetRPE: String
  tempo: String
  actualReps: String
  actualWeight: Float
  actualRPE: String
  notes: String
  completed: Boolean!
  completedAt: String
}

type StrengthExercise {
  id: String!
  name: String!
  section: String!
  order: Int!
  sets: [StrengthSet!]!
}

type RunWorkout {
  id: String!
  targetMiles: Float
  targetPace: String
  heartRateZone: String
  actualMiles: Float
  actualTime: Int
  avgHeartRate: Int
  maxHeartRate: Int
  notes: String
  completed: Boolean!
  completedAt: String
}

type Workout {
  id: String!
  date: String!
  dayOfWeek: Int!
  type: String!
  exercises: [StrengthExercise!]!
  runWorkout: RunWorkout
  notes: String
  completedAt: String
  createdAt: String!
}

type TrainingWeek {
  id: String!
  weekOf: String!
  workouts: [Workout!]!
  createdAt: String!
  updatedAt: String!
}

extend type Query {
  trainingWeek(weekOf: String!): TrainingWeek
  workout(id: String!): Workout
  weekWorkouts(weekOf: String!): [Workout!]!
}

extend type Mutation {
  uploadTrainingPDF(pdfPath: String!, weekOf: String!): TrainingWeek!
  logSet(setId: String!, actualReps: String, actualWeight: Float, actualRPE: String, notes: String): StrengthSet!
  completeSet(setId: String!): StrengthSet!
  createRunWorkout(weekOf: String!, date: String!, targetMiles: Float, targetPace: String): Workout!
  logRunWorkout(workoutId: String!, actualMiles: Float!, actualTime: Int!, avgHeartRate: Int, maxHeartRate: Int, notes: String): RunWorkout!
  completeWorkout(workoutId: String!): Workout!
  createRecoveryWorkout(weekOf: String!, date: String!, notes: String): Workout!
}
```

---

### Phase 4: GraphQL Resolvers

**Create new file:** `server/src/resolvers/workouts.ts`

Implement all Query resolvers:

**trainingWeek(weekOf)**
- Auth: require context.user.personId
- Get athlete by personId
- Fetch TrainingWeek with all workouts, exercises, sets, and runWorkout
- Include in order: exercises by order ASC, sets by setNumber ASC
- Return null if not found

**workout(id)**
- Fetch single workout with full nested data
- Return null if not found

**weekWorkouts(weekOf)**
- Auth required
- Get athlete, then all workouts in that training week
- Order by dayOfWeek ASC
- Return empty array if not found

Implement all Mutation resolvers:

**uploadTrainingPDF(pdfPath, weekOf)**
- Auth required
- Create or get athlete (by personId)
- Delete any existing TrainingWeek for that athlete/weekOf
- Call parsePersistPDF(pdfPath)
- For each parsed workout:
  - Calculate actual date using getWorkoutDate()
  - Create Workout with type="strength"
  - Create StrengthExercise for each exercise (with order)
  - Create StrengthSet for each set
- Return created TrainingWeek with all data

**logSet(setId, actualReps, actualWeight, actualRPE, notes)**
- Auth required
- Update StrengthSet with actual values (only update provided fields)
- Return updated set

**completeSet(setId)**
- Auth required
- Update StrengthSet: completed=true, completedAt=now
- Return updated set

**createRunWorkout(weekOf, date, targetMiles, targetPace)**
- Auth required
- Get athlete and TrainingWeek
- Calculate dayOfWeek from date
- Create Workout with type="run"
- Create RunWorkout with targets
- Return created Workout

**logRunWorkout(workoutId, actualMiles, actualTime, avgHeartRate, maxHeartRate, notes)**
- Auth required
- Update RunWorkout with actual values
- Set completed=true, completedAt=now
- Return updated RunWorkout

**completeWorkout(workoutId)**
- Auth required
- Update Workout: completedAt=now
- Return updated Workout

**createRecoveryWorkout(weekOf, date, notes)**
- Auth required
- Get athlete and TrainingWeek
- Calculate dayOfWeek from date
- Create Workout with type="recovery"
- Return created Workout

---

### Phase 5: Apollo Server Integration

**File to modify:** `server/src/index.ts` (main Apollo setup)

Changes:
1. Import new schema from `schema/workouts.graphql`
2. Import new resolvers from `resolvers/workouts.ts`
3. Add to typeDefs array
4. Merge resolvers into Query and Mutation

Pattern (already established in your codebase):
```typescript
const allTypeDefs = [
  // existing...
  workoutTypeDefs,
];

const allResolvers = {
  Query: {
    // existing...
    ...workoutResolvers.Query,
  },
  Mutation: {
    // existing...
    ...workoutResolvers.Mutation,
  },
};
```

---

### Phase 6: Simple Read-Only UI Component

**Create new file:** `client/src/pages/WorkoutPage.tsx`

This is a minimal, read-only component to display parsed workout data. No logging functionality yet. Purpose: verify backend parsed the PDF correctly and stored exercises/sets properly.

**Simple Layout:**

1. **Header**
   - "Training" title
   - Week input field (text, format: "2025-04-28")
   - "Load Week" button

2. **Display Section** (after loading a week)
   - For each workout in the week:
     - **Workout Header**: Date (e.g., "Monday, April 28") + Type badge (Strength/Run/Recovery)
     - **If Strength Type**:
       - For each exercise:
         - Exercise name (bold)
         - Section label (gray, smaller, e.g., "Strength Intensity 1")
         - Sets table (read-only):
           - Columns: Set #, Target Reps, Weight, RPE, Tempo
           - One row per set
           - Example row: "1 | 6 | — | 7 | 21X1"
     - **If Run Type**:
       - Target Miles, Target Pace, Heart Rate Zone (if set)
     - **If Recovery Type**:
       - Notes (if any)

3. **Error Handling**
   - Show error message if training week not found
   - Show loading state while fetching

**Styling:**
- Dark theme (#111111 background, #F5F0E8 text)
- Simple, no animations
- Table for sets (use HTML table element or CSS Grid)
- Readable on mobile (no horizontal scroll)

**GraphQL Query:**
```graphql
query GetTrainingWeek($weekOf: String!) {
  trainingWeek(weekOf: $weekOf) {
    id
    weekOf
    workouts {
      id
      date
      dayOfWeek
      type
      exercises {
        id
        name
        section
        order
        sets {
          id
          setNumber
          targetReps
          targetWeight
          targetRPE
          tempo
        }
      }
      runWorkout {
        id
        targetMiles
        targetPace
        heartRateZone
      }
    }
  }
}
```

**No mutations, no editing, no complex state. Just fetch and display.**

---

### Phase 7: React Router Integration

**File to modify:** `client/src/App.tsx` or routing setup

Add route:
```
/:personSlug/workouts → <WorkoutPage />
```

Only show for authenticated users. Can gate to just Jon if desired.

---

## Testing & Verification Workflow

### Part A: Backend Testing (GraphQL Explorer)

After Phases 1-5 are complete, before building the UI:

1. **Ensure PDF is accessible locally**
   - Download the example PDF: `persist-031626.pdf`
   - Save to a known path (e.g., `/tmp/persist-031626.pdf`)

2. **Test via GraphQL Explorer** (Apollo Sandbox at `/graphql`)
   - Use the `uploadTrainingPDF` mutation:
     ```graphql
     mutation {
       uploadTrainingPDF(
         pdfPath: "/tmp/persist-031626.pdf"
         weekOf: "2025-03-16"
       ) {
         id
         weekOf
         workouts {
           id
           date
           type
           exercises {
             name
             section
             sets {
               setNumber
               targetReps
               targetWeight
               targetRPE
               tempo
             }
           }
         }
       }
     }
     ```

3. **Verify the response**
   - Check that you have 3 workouts (Monday, Wednesday, Friday)
   - Check that exercises are parsed correctly (split stance deadlift, strict press, floor press, etc.)
   - Check that sets have correct targetReps, targetRPE, and tempo values
   - Check that weights are numeric where specified

4. **Query the stored data**
   - Use `trainingWeek` query:
     ```graphql
     query {
       trainingWeek(weekOf: "2025-03-16") {
         workouts {
           date
           exercises {
             name
             section
             sets {
               setNumber
               targetReps
               targetWeight
               targetRPE
               tempo
             }
           }
         }
       }
     }
     ```
   - Verify the response matches what was uploaded

5. **Check SQLite directly** (optional but recommended)
   - SSH into Pi
   - Open SQLite: `sqlite3 server/dev.db`
   - Check tables:
     ```sql
     SELECT COUNT(*) FROM "Workout";
     SELECT COUNT(*) FROM "StrengthExercise";
     SELECT COUNT(*) FROM "StrengthSet";
     SELECT * FROM "StrengthSet" LIMIT 5;
     ```

### Part B: Frontend Testing (After Phase 6)

1. **Start dev servers**
   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

2. **Navigate to** `http://localhost:5173/jon/workouts` (or via diverseydash.com if testing on mobile)

3. **Enter week date** "2025-03-16" and click "Load Week"

4. **Verify display**
   - See 3 workouts (Mon, Wed, Fri)
   - See all exercises for each day
   - See all sets with target values
   - Verify numbers match GraphQL explorer output

5. **No errors in browser console**

---

## Environment Variables Needed

Add to `.env` (server):
```
ANTHROPIC_API_KEY=sk-...  // Already have this for message parser
```

No new env vars needed; PDF parsing uses existing Anthropic key.

---

## Database Migration Command

After Prisma schema updated:
```bash
npx prisma migrate dev --name add_workouts
```

This creates migration file and updates dev.db.

---

## File Structure Summary

```
server/
  prisma/
    schema.prisma  (MODIFY: add 6 models + Person.athlete)
  src/
    services/
      workoutParsing.ts  (NEW)
    schema/
      workouts.graphql  (NEW)
    resolvers/
      workouts.ts  (NEW)
    index.ts  (MODIFY: import + merge schema/resolvers)

client/
  src/
    pages/
      WorkoutPage.tsx  (NEW)
    App.tsx or router  (MODIFY: add route)
```

---

## Implementation Approach for Claude Code

When feeding to Claude Code:

1. **Phase 1**: Update Prisma schema, run migration
2. **Phase 2**: Create PDF parsing service
3. **Phase 3**: Create GraphQL schema
4. **Phase 4**: Create resolvers
5. **Phase 5**: Integrate into Apollo Server
6. **Test**: Use GraphQL explorer to verify PDF parsing works
7. **Phase 6**: Create read-only UI component
8. **Phase 7**: Add router integration
9. **Final test**: Load a real PDF, verify data in database, view in UI

Each phase is independent and builds on the previous one.

---

## Next Steps (After Backend Complete)

Once the backend is complete and verified:
- You have full CRUD resolvers ready (logSet, completeSet, etc.)
- You can build logging UI incrementally (Option A: inline, Option B: modal, Option C: table)
- No changes needed to backend for any UI approach

The backend is production-ready and can handle the logging UI you design later.
