export interface StrengthSetData {
  id: string
  setNumber: number
  targetReps: string | null
  targetWeight: number | null
  targetRPE: string | null
  tempo: string | null
  actualReps: string | null
  actualWeight: number | null
  actualRPE: string | null
  notes: string | null
  completed: boolean
  completedAt: string | null
}

export interface ExerciseData {
  id: string
  name: string
  section: string
  order: number
  loadingNote: string | null
  sets: StrengthSetData[]
}

export interface RunWorkoutData {
  id: string
  targetMiles: number | null
  targetPace: string | null
  heartRateZone: string | null
  actualMiles: number | null
  actualTime: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  actualRPE: number | null
  notes: string | null
  completed: boolean
  completedAt: string | null
}

export interface WorkoutData {
  id: string
  date: string
  dayOfWeek: number
  type: 'strength' | 'run' | 'recovery'
  exercises: ExerciseData[]
  runWorkout: RunWorkoutData | null
  notes: string | null
  completedAt: string | null
}

export interface TrainingWeekData {
  id: string
  weekOf: string
  workouts: WorkoutData[]
}

export interface DayTile {
  date: string
  dayLabel: string
  dayNum: number
  isToday: boolean
  isPast: boolean
  workout: WorkoutData | null
}

export type WorkoutType = 'strength' | 'run' | 'recovery'

export interface LocalSetState {
  actualReps: string
  actualWeight: string
  actualRPE: string
  notes: string
  completed: boolean
}
