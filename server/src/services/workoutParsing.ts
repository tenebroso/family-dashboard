import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Training goal — read by generateRunPrescriptions().
 *
 * Edit this constant directly when goals change. Free-form text;
 * Claude reads it as part of a cached system prompt block.
 *
 * NO database, NO UI, NO seed script for v1 — by design.
 */
export const TRAINING_GOAL = `
ATHLETE: Jon Bukiewicz, 42M, 5'11", ~228 lbs, Milwaukee WI.

PRIORITIES (in order): 1) Support fat loss through appropriate training load. 2) Maintain aerobic base. 3) Avoid injury — especially overreaching on easy days.

PRESCRIPTION FORMAT: For each run include specific pace range OR HR cap (not both unless structured), total distance, session purpose, and fueling note if relevant.
`.trim()

export interface ParsedSet {
  setNumber: number
  targetReps: string | null
  targetWeight: number | null
  targetRPE: string | null
  tempo: string | null
}

export interface ParsedExercise {
  name: string
  section: string
  loadingNote: string | null
  sets: ParsedSet[]
}

export interface ParsedWorkout {
  dayOfWeek: number
  dayName: string
  exercises: ParsedExercise[]
}

export function getWorkoutDate(weekOf: string, dayName: string): { dayOfWeek: number; date: string } {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  // Claude sometimes returns "Monday, April 6th, 2026" — take only the weekday word
  const normalized = dayName.split(',')[0].trim()
  const dayIndex = dayNames.findIndex(d => d.toLowerCase() === normalized.toLowerCase())
  if (dayIndex === -1) throw new Error(`Unknown day name: ${dayName}`)

  const [year, month, day] = weekOf.split('-').map(Number)
  const monday = new Date(year, month - 1, day)
  const target = new Date(monday)
  target.setDate(monday.getDate() + dayIndex)

  const date = [
    target.getFullYear(),
    String(target.getMonth() + 1).padStart(2, '0'),
    String(target.getDate()).padStart(2, '0'),
  ].join('-')

  return { dayOfWeek: dayIndex, date }
}

export async function parsePdfWorkouts(
  pdfPath: string,
  programTrack: string = 'Minimalist',
): Promise<ParsedWorkout[]> {
  const pdfBase64 = fs.readFileSync(pdfPath).toString('base64')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: [
      {
        type: 'text',
        text: `You are a workout programming parser. Extract structured workout data from PDF training plans.

Rules:
- targetReps: preserve exactly as written ("6", "6-8", "Max Unbroken reps", "Max reps", etc.)
- targetRPE: preserve exactly ("7", "8", "9", "9+", "7-8", "8-9", etc.), null if absent
- tempo: "21X1" format (eccentric-pause-concentric-pause), null if absent
- targetWeight: numeric value only in lbs, null if not specified
- Preserve exercise names exactly as written in the PDF
- dayOfWeek: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday
- Loading Notes: do NOT create a separate exercise for "Loading Note" text. Instead, attach the full loading note text to the loadingNote field of the exercise it follows. If there is no loading note for an exercise, set loadingNote to null.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: 'extract_workouts',
        description: 'Extract structured workout data from the training plan PDF',
        input_schema: {
          type: 'object' as const,
          properties: {
            workouts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dayOfWeek: { type: 'number', description: '0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday' },
                  dayName: { type: 'string' },
                  exercises: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        section: { type: 'string', description: 'e.g. "Strength Intensity 1", "Finisher"' },
                        loadingNote: { type: 'string', description: 'Full text of the Loading Note for this exercise, or null if none' },
                        sets: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              setNumber: { type: 'number' },
                              targetReps: { type: 'string' },
                              targetWeight: { type: 'number' },
                              targetRPE: { type: 'string' },
                              tempo: { type: 'string' },
                            },
                            required: ['setNumber'],
                          },
                        },
                      },
                      required: ['name', 'section', 'sets'],
                    },
                  },
                },
                required: ['dayOfWeek', 'dayName', 'exercises'],
              },
            },
          },
          required: ['workouts'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'extract_workouts' },
    messages: [
      {
        role: 'user',
        content: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
          } as any,
          {
            type: 'text',
            text: `Extract the ${programTrack} workouts (all days) from this training plan PDF.`,
          },
        ],
      },
    ],
  })

  console.error('[DEBUG] stop_reason:', response.stop_reason)
  console.error('[DEBUG] usage:', JSON.stringify(response.usage))
  console.error('[DEBUG] content blocks:', response.content.map(b => b.type).join(', '))
  for (const block of response.content) {
    if (block.type === 'text') console.error('[DEBUG] text block:', block.text.slice(0, 500))
    if (block.type === 'tool_use') console.error('[DEBUG] tool_use input:', JSON.stringify(block.input))
  }

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return structured workout data')
  }

  const data = toolUse.input as { workouts?: ParsedWorkout[] }
  if (!data.workouts) {
    throw new Error(`Claude tool response missing "workouts" key. Raw input: ${JSON.stringify(data)}`)
  }
  return data.workouts
}

export interface PastRunSummary {
  date: string
  dayName: string
  workoutType: string | null
  prescribed: {
    targetMiles: number | null
    targetPace: string | null
    heartRateZone: string | null
    segments: Array<{
      order: number
      label: string
      type: string
      repeat: number | null
      distanceMi: number | null
      durationSec: number | null
      pace: string | null
      heartRateZone: string | null
      notes: string | null
    }>
  }
  actual: {
    actualMiles: number | null
    actualTime: number | null
    avgHeartRate: number | null
    maxHeartRate: number | null
    actualRPE: number | null
    notes: string | null
  }
}

export interface PrescribedSegment {
  order: number
  label: string
  type: string
  repeat: number | null
  distanceMi: number | null
  durationSec: number | null
  pace: string | null
  heartRateZone: string | null
  notes: string | null
}

export interface PrescribedRun {
  workoutType: string
  summary: string
  targetMiles: number | null
  targetPace: string | null
  heartRateZone: string | null
  notes: string | null
  segments: PrescribedSegment[]
}

export interface RunPrescriptions {
  tuesday: PrescribedRun
  saturday: PrescribedRun
  thursdayYogaNote: string | null
}

function serializePastRun(r: PastRunSummary): string {
  const lines: string[] = []
  const typeLabel = (r.workoutType ?? 'run').toUpperCase()
  lines.push(`${r.date} (${r.dayName}) — ${typeLabel}`)

  const presc: string[] = []
  if (r.prescribed.targetMiles != null) presc.push(`${r.prescribed.targetMiles} mi`)
  if (r.prescribed.targetPace) presc.push(`@ ${r.prescribed.targetPace}/mi`)
  if (r.prescribed.heartRateZone) presc.push(r.prescribed.heartRateZone)
  lines.push(`  Prescribed: ${presc.length ? presc.join(', ') : '(none recorded)'}`)

  if (r.prescribed.segments.length > 0) {
    lines.push(`  Structure:`)
    for (const s of r.prescribed.segments) {
      const parts: string[] = []
      if (s.repeat) parts.push(`×${s.repeat}`)
      if (s.distanceMi != null) parts.push(`${s.distanceMi} mi`)
      if (s.durationSec != null) parts.push(`${s.durationSec}s`)
      if (s.pace) parts.push(`@ ${s.pace}`)
      if (s.heartRateZone) parts.push(s.heartRateZone)
      lines.push(`    ${s.order}. ${s.label} ${parts.join(' ')}`)
    }
  }

  const a = r.actual
  if (a.actualMiles != null || a.actualTime != null) {
    const actual: string[] = []
    if (a.actualMiles != null) actual.push(`${a.actualMiles} mi`)
    if (a.actualTime != null) {
      const mm = Math.floor(a.actualTime / 60)
      const ss = String(a.actualTime % 60).padStart(2, '0')
      actual.push(`in ${mm}:${ss}`)
      if (a.actualMiles) {
        const paceSec = a.actualTime / a.actualMiles
        const paceMm = Math.floor(paceSec / 60)
        const paceSs = String(Math.round(paceSec % 60)).padStart(2, '0')
        actual.push(`(${paceMm}:${paceSs}/mi avg)`)
      }
    }
    if (a.avgHeartRate != null) actual.push(`avg HR ${a.avgHeartRate}`)
    if (a.maxHeartRate != null) actual.push(`max HR ${a.maxHeartRate}`)
    if (a.actualRPE != null) actual.push(`RPE ${a.actualRPE}`)
    lines.push(`  Actual:     ${actual.join(', ')}`)
  } else {
    lines.push(`  Actual:     (not logged)`)
  }
  if (a.notes) lines.push(`  Notes:      "${a.notes}"`)
  return lines.join('\n')
}

export async function generateRunPrescriptions(args: {
  pastRuns: PastRunSummary[]
  weekOf: string
}): Promise<RunPrescriptions> {
  const { pastRuns, weekOf } = args

  const historyBlock = pastRuns.length === 0
    ? '(No past runs logged. This is the athlete\'s first prescribed week — start conservatively at 4 mi easy / 5 mi long.)'
    : pastRuns.map(serializePastRun).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: [
      {
        type: 'text',
        text: `You are a running coach prescribing two runs per week for an athlete that is following a 4 day training schedule focusing on weightlifting movements with dumbbells and barbells. Fill in running prescriptions based on the athlete's training history and goals.

ATHLETE'S TRAINING GOAL:
"""
${TRAINING_GOAL}
"""

REASONING RULES:
For each past run you see, you have BOTH the prescribed targets AND the athlete's actual results. Base your prescriptions on the actuals:

- If actual pace is consistently faster than prescribed at low RPE/HR, the athlete is ready for harder efforts.
- If RPE was high or notes describe struggle, scale volume/intensity down.
- If HR was elevated for the same prescribed pace, watch for accumulated fatigue.

Output via the prescribe_runs tool.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: 'prescribe_runs',
        description: 'Prescribe two runs based on past actuals + goal',
        input_schema: {
          type: 'object' as const,
          properties: {
            tuesday: {
              type: 'object',
              description: 'Easy aerobic run. workoutType must be "easy". segments must be [].',
              properties: {
                workoutType: { type: 'string', enum: ['easy'] },
                summary: { type: 'string', description: 'Short title, e.g. "Easy Run — 4.5 mi"' },
                targetMiles: { type: 'number' },
                targetPace: { type: 'string', description: 'e.g. "9:30"' },
                heartRateZone: { type: 'string', description: 'e.g. "Zone 2"' },
                notes: { type: 'string', description: 'Coaching cue' },
                segments: { type: 'array', items: { type: 'object' }, maxItems: 0 },
              },
              required: ['workoutType', 'summary', 'targetMiles', 'segments'],
            },
            saturday: {
              type: 'object',
              description: 'Long or structured run. May include segments.',
              properties: {
                workoutType: { type: 'string', enum: ['long', 'tempo', 'fartlek', 'intervals', 'progression'] },
                summary: { type: 'string', description: 'Short title, e.g. "Fartlek — 6 mi with 8×60s surges"' },
                targetMiles: { type: 'number' },
                targetPace: { type: 'string' },
                heartRateZone: { type: 'string' },
                notes: { type: 'string' },
                segments: {
                  type: 'array',
                  description: 'Empty for simple long runs. Populated for fartlek/intervals/progression.',
                  items: {
                    type: 'object',
                    properties: {
                      order: { type: 'number' },
                      label: { type: 'string' },
                      type: { type: 'string', enum: ['warmup', 'easy', 'tempo', 'interval', 'recovery', 'cooldown'] },
                      repeat: { type: 'number' },
                      distanceMi: { type: 'number' },
                      durationSec: { type: 'number' },
                      pace: { type: 'string' },
                      heartRateZone: { type: 'string' },
                      notes: { type: 'string' },
                    },
                    required: ['order', 'label', 'type'],
                  },
                },
              },
              required: ['workoutType', 'summary', 'targetMiles', 'segments'],
            },
            thursdayYogaNote: {
              type: 'string',
              description: 'Optional one-line yoga suggestion, e.g. "Vinyasa flow — focus on hips". May be empty string.',
            },
          },
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'prescribe_runs' },
    messages: [
      {
        role: 'user',
        content: `Week of ${weekOf}.

Past 8 completed runs (most recent first):

  ${historyBlock}.`,
      },
    ],
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return run prescriptions')
  }
  return toolUse.input as RunPrescriptions
}
