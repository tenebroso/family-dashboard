export const workoutTypeDefs = `#graphql
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
    loadingNote: String
    coachNotes: String
    sets: [StrengthSet!]!
  }

  type ExerciseHistorySet {
    setNumber: Int!
    reps: String
    weight: Float
    rpe: String
  }

  type ExerciseHistorySession {
    workoutId: String!
    date: String!
    relative: String!
    sets: [ExerciseHistorySet!]!
  }

  type ExerciseHistory {
    exerciseId: String!
    exerciseName: String!
    sessions: [ExerciseHistorySession!]!
  }

  type RunSegment {
    id: String!
    order: Int!
    label: String!
    type: String!
    repeat: Int
    distanceMi: Float
    durationSec: Int
    pace: String
    heartRateZone: String
    notes: String
  }

  type RunWorkout {
    id: String!
    workoutType: String
    targetMiles: Float
    targetPace: String
    heartRateZone: String
    actualMiles: Float
    actualTime: Int
    avgHeartRate: Int
    maxHeartRate: Int
    actualRPE: Int
    notes: String
    completed: Boolean!
    completedAt: String
    segments: [RunSegment!]!
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
`
