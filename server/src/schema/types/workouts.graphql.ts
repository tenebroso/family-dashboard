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
`
