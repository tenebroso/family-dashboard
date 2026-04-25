import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  programTrack: string = 'Pump Lift 3x'
): Promise<ParsedWorkout[]> {
  const pdfBase64 = fs.readFileSync(pdfPath).toString('base64')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: [
      {
        type: 'text',
        text: `You are a workout programming parser. Extract structured workout data from PDF training plans.

For the ${programTrack} program, extract ONLY Monday, Wednesday, and Friday workouts.
Include these sections: Warmup, Strength Intensity 1, Loading Note, Strength Intensity 2, Loading Note, Strength Balance, Loading Note, Finisher, Cooldown.
Exclude: optional sections.

Rules:
- targetReps: preserve exactly as written ("6", "6-8", "Max Unbroken reps", "Max reps", etc.)
- targetRPE: preserve exactly ("7", "8", "9", "9+", "7-8", "8-9", etc.), null if absent
- tempo: "21X1" format (eccentric-pause-concentric-pause), null if absent
- targetWeight: numeric value only in lbs, null if not specified
- Preserve exercise names exactly as written in the PDF
- dayOfWeek: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday`,
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
            text: `Extract the ${programTrack} workouts (Monday, Wednesday, Friday only) from this training plan PDF.`,
          },
        ],
      },
    ],
  })

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
