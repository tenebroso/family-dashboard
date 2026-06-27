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
ATHLETE: Jon, 42M, 5'11", 224 lb (June 2026). Software engineering manager — sedentary desk job baseline, ~8-11k steps/day.

DEXA CONTEXT (June 2026 vs. one year prior): +26 lb fat, -5 lb muscle. He is in a structured calorie deficit (~2,160 cal/day, 175g+ protein). No alcohol since Oct 2025. Recently restarted bupropion HCL XL 300mg. Stopped GLP-1 in May 2026.

PRIMARY GOAL — RECOMP: Lose fat and simultaneously regain the lost 5 lb of muscle via muscle memory + progressive overload + high protein. Cut first; no bulk until reaching ~187-190 lb target. He is a recomp candidate: previously trained + fat surplus means fat can fund muscle regrowth.

LIFTING PRIORITIES (in order):
1. Progressive overload is the primary success signal. Rising weights and/or reps week-over-week = proof muscle is returning even as the scale drops. This is what matters most.
2. Protein 175g+ on lifting days is non-negotiable for muscle retention in a deficit.
3. Avoid overreaching — he's eating in a deficit, so recovery capacity is limited. One hard week followed by a performance dip is usually fueling or sleep, not a true regression.

COACH NOTE CALIBRATION:
- A single session at the same weight is NOT a plateau. Flag plateaus only when ≥3 sessions show the same top weight with RPE not dropping.
- A single session below prior weight is NOT regression. Flag regression only when 2-3 consecutive sessions trend down.
- Scale stalls are noise — strength trend and rising reps are the real scoreboard.
- Silence (empty string) beats a generic note. Only write when something specific is actionable.
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
  type: 'strength' | 'intervals' | 'active_recovery'
  exercises: ParsedExercise[]
  notes: string | null
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

export async function parsePdfWorkouts(pdfPath: string): Promise<ParsedWorkout[]> {
  const pdfBase64 = fs.readFileSync(pdfPath).toString('base64')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: [
      {
        type: 'text',
        text: `You are a workout programming parser. Extract ALL programmed days from a Pump Lift 4x training plan PDF.

This program has exactly 6 programmed days per week:
- 4 strength training days (lifting with exercises, sets, reps, RPE, tempo)
- 2 non-strength days (labeled "Active Recovery Day" in the PDF — but one contains structured work/rest intervals and one is low-intensity movement + mobility)

Rules for ALL days:
- dayOfWeek: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
- dayName: use the FULL day name as labeled in the PDF (e.g. "Monday, June 22nd, 2026")
- type: classify based on CONTENT, not the PDF header label
  - "strength" → the day contains lifting exercises with sets, reps, and RPE/tempo
  - "intervals" → the day contains structured work/rest conditioning intervals (e.g. "30 sec on / 30 sec off × 10 rounds", HIIT, sprints) even if the PDF header says "Active Recovery"
  - "active_recovery" → the day contains only low-intensity steady-state movement (walk/hike/bike/swim) and/or mobility work with NO structured work/rest intervals
- Extract every single programmed day — do not skip any

Rules for STRENGTH days (type="strength"):
- targetReps: preserve exactly as written ("6", "6-8", "Max Unbroken reps", "Max reps", etc.)
- targetRPE: preserve exactly ("7", "8", "9", "9+", "7-8", "8-9", etc.), null if absent
- tempo: "21X1" format (eccentric-pause-concentric-pause), null if absent
- targetWeight: numeric value only in lbs, null if not specified
- Preserve exercise names exactly as written in the PDF
- Loading Notes: attach the full loading note text to the loadingNote field of the exercise it follows, not as a separate exercise
- exercises: populate with all exercises from the day
- notes: null

Rules for INTERVALS and ACTIVE_RECOVERY days:
- exercises: empty array []
- notes: capture the FULL workout description exactly as written in the PDF, including all details, rounds, durations, intensities, movements, and mobility work`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: 'extract_workouts',
        description: 'Extract all programmed workout days from the Pump Lift 4x training plan PDF',
        input_schema: {
          type: 'object' as const,
          properties: {
            workouts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dayOfWeek: { type: 'number', description: '0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday' },
                  dayName: { type: 'string' },
                  type: { type: 'string', enum: ['strength', 'intervals', 'active_recovery'], description: 'strength for lifting days, intervals for cardio day, active_recovery for recovery day' },
                  exercises: {
                    type: 'array',
                    description: 'Populated for strength days. Empty array for intervals/active_recovery days.',
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
                  notes: { type: 'string', description: 'Full workout description for intervals/active_recovery days. Null for strength days.' },
                },
                required: ['dayOfWeek', 'dayName', 'type', 'exercises'],
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
            text: 'Extract ALL programmed days from this Pump Lift 4x training plan PDF — all 4 strength days, the intervals day, and the active recovery day. Do not skip any day.',
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

export interface DayPrescription {
  day: string
  type: 'run' | 'yoga' | 'mobility' | 'rest'
  runWorkout?: PrescribedRun | null
  note?: string | null
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

export async function generateWeekPrescriptions(args: {
  pastRuns: PastRunSummary[]
  weekOf: string
  strengthDays: string[]
}): Promise<DayPrescription[]> {
  const { pastRuns, weekOf, strengthDays } = args

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const normalizedStrength = strengthDays.map(d => d.split(',')[0].trim().toLowerCase())
  const availableDays = allDays.filter(d => !normalizedStrength.includes(d.toLowerCase()))

  const historyBlock = pastRuns.length === 0
    ? "(No past runs logged. Start conservatively at 4 mi easy / 5 mi long.)"
    : pastRuns.map(serializePastRun).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: [
      {
        type: 'text',
        text: `You are a running coach and recovery planner. The athlete follows a 4-day weightlifting program and needs complementary training for the remaining days.

ATHLETE'S TRAINING GOAL:
"""
${TRAINING_GOAL}
"""

SCHEDULING RULES:
- Prescribe 1-2 runs, exactly 1 yoga session, optionally 1 mobility/accessory day, rest for remaining days.
- Avoid placing hard runs immediately before or after a lifting day when possible. Easy runs and yoga/mobility are fine adjacent to lifting.
- If only 2 days are available: 1 run + 1 yoga (no mobility, no second run).
- If 3 days are available: 1 run + 1 yoga + 1 rest (skip mobility).
- If 4+ days are available: 2 runs + 1 yoga + optionally 1 mobility + rest for the remainder.

RUN REASONING:
For each past run, you have BOTH prescribed targets AND actual results. Base prescriptions on actuals:
- Actual pace consistently faster than prescribed at low RPE/HR → athlete ready for harder efforts.
- High RPE or notes describe struggle → scale back volume/intensity.
- Elevated HR for the same pace → possible accumulated fatigue.

Output via the prescribe_week tool. You MUST include every available day.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: 'prescribe_week',
        description: 'Prescribe complementary workouts for all non-lifting days',
        input_schema: {
          type: 'object' as const,
          properties: {
            days: {
              type: 'array',
              description: 'One entry per available day. Must cover ALL available days.',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string', description: 'Day name, e.g. "Friday"' },
                  type: { type: 'string', enum: ['run', 'yoga', 'mobility', 'rest'] },
                  runWorkout: {
                    type: 'object',
                    description: 'Required when type is "run". Omit otherwise.',
                    properties: {
                      workoutType: { type: 'string', enum: ['easy', 'long', 'tempo', 'fartlek', 'intervals', 'progression'] },
                      summary: { type: 'string', description: 'Short title, e.g. "Easy Run — 4.5 mi"' },
                      targetMiles: { type: 'number' },
                      targetPace: { type: 'string', description: 'e.g. "9:30"' },
                      heartRateZone: { type: 'string', description: 'e.g. "Zone 2"' },
                      notes: { type: 'string', description: 'Coaching cue' },
                      segments: {
                        type: 'array',
                        description: 'Empty for simple runs. Populated for fartlek/intervals/progression.',
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
                  note: { type: 'string', description: 'Optional one-line coaching note for yoga/mobility days' },
                },
                required: ['day', 'type'],
              },
            },
          },
          required: ['days'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'prescribe_week' },
    messages: [
      {
        role: 'user',
        content: `Week of ${weekOf}.

Lifting days this week: ${strengthDays.join(', ')}.
Available days for complementary training: ${availableDays.join(', ')}.

Past 8 completed runs (most recent first):

${historyBlock}`,
      },
    ],
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return week prescriptions')
  }
  const data = toolUse.input as { days?: DayPrescription[] }
  return data.days ?? []
}
