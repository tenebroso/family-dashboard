import Anthropic from '@anthropic-ai/sdk'
import { TRAINING_GOAL } from './workoutParsing'
import type { HistorySession } from './exerciseHistory'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CoachReviewSet {
  targetReps: string | null
  targetWeight: number | null
  targetRPE: string | null
  tempo: string | null
}

export interface CoachReviewExercise {
  name: string
  section: string
  sets: CoachReviewSet[]
  history: HistorySession[]
}

function serializeExercise(ex: CoachReviewExercise): string {
  const lines: string[] = []
  lines.push(`EXERCISE: ${ex.name}  (${ex.section})`)
  lines.push(`THIS WEEK PRESCRIBED:`)
  for (let i = 0; i < ex.sets.length; i++) {
    const s = ex.sets[i]
    const parts: string[] = []
    if (s.targetReps != null) parts.push(`${s.targetReps} reps`)
    if (s.targetWeight != null) parts.push(`@ ${s.targetWeight}lb`)
    if (s.targetRPE != null) parts.push(`@ RPE ${s.targetRPE}`)
    if (s.tempo) parts.push(`tempo ${s.tempo}`)
    lines.push(`  Set ${i + 1} — ${parts.length ? parts.join(' ') : '(no targets)'}`)
  }
  if (ex.history.length === 0) {
    lines.push(`HISTORY: no prior history`)
  } else {
    lines.push(`HISTORY (most recent first):`)
    for (const session of ex.history) {
      lines.push(`  ${session.date} (${session.relative}):`)
      for (const set of session.sets) {
        const w = set.weight != null && set.weight > 0 ? `×${set.weight}` : ''
        const r = set.reps != null ? set.reps : '?'
        const rpe = set.rpe != null ? ` @ RPE ${set.rpe}` : ''
        lines.push(`    Set ${set.setNumber} — ${r}${w}${rpe}`)
      }
    }
  }
  return lines.join('\n')
}

interface CoachToolOutput {
  notes: Array<{ exerciseName: string; note: string }>
}

export async function generateCoachNotes(
  exercises: CoachReviewExercise[],
): Promise<Map<string, string>> {
  if (exercises.length === 0) return new Map()

  const userBody = exercises.map(serializeExercise).join('\n---\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: [
      {
        type: 'text',
        text: `You are a strength coach reviewing a planned week of strength workouts.
For each movement, you have the prescribed targets for THIS week and up to the last 6 sessions of that movement. Your job: when something is worth saying, write ONE actionable coaching note. When there's nothing to say, return an empty string for that movement — silence is better than filler.

ATHLETE'S TRAINING GOAL:
"""
${TRAINING_GOAL}
"""

REVIEW RULES:
- 1–2 short sentences max.
- Return "" (empty) for: warm-up/mobility/cooldown movements, exercises with zero history, exercises with stable progression and nothing notable.
- Plateau (same top weight ≥3 sessions): suggest ONE concrete accessory or technique tweak (e.g., paused reps, heel-elevated variant, tempo change, accommodating resistance). Reference the specific stuck weight.
- Regression (top weight dropped vs. prior trend): note it and ask the athlete to check recovery / sleep / fueling before pushing harder.
- Progression (climbing weight, RPE under 9): validate and suggest the next target weight or rep increase.
- Don't invent numbers. Only cite weights/reps that appear in the history.
- Echo the exerciseName EXACTLY as it appears in the input (case, spacing, punctuation).`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: 'write_coach_notes',
        description: 'Write a coach note for each exercise (or empty string when no note is warranted).',
        input_schema: {
          type: 'object' as const,
          properties: {
            notes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  exerciseName: { type: 'string' },
                  note: { type: 'string' },
                },
                required: ['exerciseName', 'note'],
              },
            },
          },
          required: ['notes'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'write_coach_notes' },
    messages: [
      {
        role: 'user',
        content: `Review the following ${exercises.length} exercise(s) and produce one note per exercise via the write_coach_notes tool.\n\n${userBody}`,
      },
    ],
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return coach notes')
  }
  const data = toolUse.input as CoachToolOutput
  const map = new Map<string, string>()
  for (const n of data.notes ?? []) {
    if (typeof n.exerciseName === 'string') {
      map.set(n.exerciseName, n.note ?? '')
    }
  }
  return map
}
