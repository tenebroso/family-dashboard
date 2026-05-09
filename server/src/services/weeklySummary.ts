import Anthropic from '@anthropic-ai/sdk'
import { TRAINING_GOAL } from './workoutParsing'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface SummarySet {
  actualReps: string | null
  actualWeight: number | null
  actualRPE: string | null
  completed: boolean
}

interface SummaryExercise {
  name: string
  sets: SummarySet[]
}

interface SummaryRunWorkout {
  targetMiles: number | null
  targetPace: string | null
  actualMiles: number | null
  actualTime: number | null
  avgHeartRate: number | null
  actualRPE: number | null
  completed: boolean
}

interface SummaryWorkout {
  date: string
  dayOfWeek: number
  type: string
  completedAt: string | null
  exercises: SummaryExercise[]
  runWorkout: SummaryRunWorkout | null
}

export interface WeekSummaryData {
  weekOf: string
  workouts: SummaryWorkout[]
}

function formatPace(actualMiles: number, actualTimeSec: number): string {
  const paceSeconds = actualTimeSec / actualMiles
  const mins = Math.floor(paceSeconds / 60)
  const secs = Math.round(paceSeconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}/mi`
}

function isWorkoutComplete(w: SummaryWorkout): boolean {
  if (w.completedAt) return true
  if (w.type === 'run' && w.runWorkout?.completed) return true
  return false
}

function serializeWeek(label: string, week: WeekSummaryData): string {
  const lines: string[] = [`=== ${label} (week of ${week.weekOf}) ===`]

  const total = week.workouts.length
  const done = week.workouts.filter(isWorkoutComplete).length
  lines.push(`Completion: ${done}/${total} workouts completed`)
  lines.push('')

  // Strength
  const strengthWorkouts = week.workouts.filter(w => w.type === 'strength')
  if (strengthWorkouts.length > 0) {
    lines.push('STRENGTH:')
    let totalVolume = 0
    let totalSets = 0
    let rpeSum = 0
    let rpeCount = 0

    for (const w of strengthWorkouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (!s.completed) continue
          totalSets++
          const reps = parseFloat(s.actualReps ?? '0') || 0
          const weight = s.actualWeight ?? 0
          totalVolume += reps * weight
          if (s.actualRPE) {
            const rpe = parseFloat(s.actualRPE)
            if (!isNaN(rpe)) { rpeSum += rpe; rpeCount++ }
          }
        }
      }
      const status = isWorkoutComplete(w) ? 'COMPLETE' : 'not completed'
      lines.push(`  ${w.date}: ${w.exercises.length} exercises — ${status}`)
    }

    lines.push(`  Total completed sets: ${totalSets}`)
    lines.push(`  Total volume lifted: ${Math.round(totalVolume).toLocaleString()} lbs`)
    if (rpeCount > 0) lines.push(`  Average strength RPE: ${(rpeSum / rpeCount).toFixed(1)}`)
    lines.push('')
  }

  // Runs
  const runWorkouts = week.workouts.filter(w => w.type === 'run' && w.runWorkout)
  if (runWorkouts.length > 0) {
    lines.push('RUNS:')
    let totalMiles = 0
    let hrSum = 0; let hrCount = 0
    let rpeSum = 0; let rpeCount = 0

    for (const w of runWorkouts) {
      const r = w.runWorkout!
      const parts: string[] = []
      if (r.actualMiles != null) {
        parts.push(`${r.actualMiles} mi actual`)
        totalMiles += r.actualMiles
      } else if (r.targetMiles != null) {
        parts.push(`${r.targetMiles} mi target`)
      }
      if (r.actualMiles && r.actualTime) {
        parts.push(`avg pace ${formatPace(r.actualMiles, r.actualTime)}`)
      } else if (r.targetPace) {
        parts.push(`target pace ${r.targetPace}`)
      }
      if (r.avgHeartRate) {
        parts.push(`avg HR ${r.avgHeartRate}bpm`)
        hrSum += r.avgHeartRate; hrCount++
      }
      if (r.actualRPE != null) {
        parts.push(`RPE ${r.actualRPE}`)
        rpeSum += r.actualRPE; rpeCount++
      }
      parts.push(r.completed ? 'COMPLETE' : 'not completed')
      lines.push(`  ${w.date}: ${parts.join(' · ')}`)
    }

    lines.push(`  Total miles run: ${totalMiles.toFixed(1)}`)
    if (hrCount > 0) lines.push(`  Average HR: ${Math.round(hrSum / hrCount)}bpm`)
    if (rpeCount > 0) lines.push(`  Average run RPE: ${(rpeSum / rpeCount).toFixed(1)}`)
    lines.push('')
  }

  const yogaCount = week.workouts.filter(w => w.type === 'yoga').length
  const restCount = week.workouts.filter(w => w.type === 'rest').length
  if (yogaCount > 0) lines.push(`YOGA: ${yogaCount} session(s)`)
  if (restCount > 0) lines.push(`REST DAYS: ${restCount}`)

  return lines.join('\n')
}

export async function generateWeeklySummary(
  currentWeek: WeekSummaryData,
  previousWeek: WeekSummaryData | null,
): Promise<string> {
  const sections = [serializeWeek('CURRENT WEEK', currentWeek)]
  if (previousWeek && previousWeek.workouts.length > 0) {
    sections.push(serializeWeek('PREVIOUS WEEK', previousWeek))
  } else {
    sections.push('No previous week data available for comparison.')
  }

  const body = sections.join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: [
      {
        type: 'text',
        text: `You are a personal coach reviewing an athlete's weekly training summary. You will receive data about the current week's workouts and, if available, the prior week's data for comparison.

ATHLETE PROFILE:
"""
${TRAINING_GOAL}
"""

YOUR JOB: Write a warm, direct, and actionable weekly feedback summary. Focus on:
1. What went well this week (highlight wins, use specific numbers)
2. Key trends vs. prior week (volume, mileage, completion rate, RPE shifts) — skip if no prior week
3. 1–2 concrete recommendations for next week

FORMAT RULES:
- 3–4 short paragraphs, flowing prose (no bullet lists)
- Conversational and encouraging, not clinical
- Cite specific numbers from the data (miles, lbs, RPE values)
- If the week has no data, acknowledge it warmly and encourage logging
- Do not include a sign-off or closing phrase`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Here is the weekly training data:\n\n${body}\n\nPlease write the weekly summary feedback.`,
      },
    ],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }
  return textBlock.text
}
