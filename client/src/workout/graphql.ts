import { gql } from '@apollo/client'

export const GET_TRAINING_WEEK = gql`
  query GetTrainingWeekCalendar($weekOf: String!) {
    trainingWeek(weekOf: $weekOf) {
      id
      weekOf
      workouts {
        id
        date
        dayOfWeek
        type
        completedAt
        notes
        exercises {
          id
          name
          section
          loadingNote
          sets {
            id
            completed
          }
        }
        runWorkout {
          id
          workoutType
          targetMiles
          targetPace
          heartRateZone
          actualMiles
          completed
          segments {
            id order label type repeat
            distanceMi durationSec pace heartRateZone notes
          }
        }
      }
    }
  }
`

export const GET_STRENGTH_WORKOUT = gql`
  query GetStrengthWorkout($id: String!) {
    workout(id: $id) {
      id
      date
      dayOfWeek
      type
      notes
      completedAt
      exercises {
        id
        name
        section
        order
        loadingNote
        coachNotes
        sets {
          id
          setNumber
          targetReps
          targetWeight
          targetRPE
          tempo
          actualReps
          actualWeight
          actualRPE
          notes
          completed
          completedAt
        }
      }
    }
  }
`

export const GET_WORKOUT_EXERCISE_HISTORY = gql`
  query GetWorkoutExerciseHistory($workoutId: String!, $limit: Int) {
    workoutExerciseHistory(workoutId: $workoutId, limit: $limit) {
      exerciseId
      exerciseName
      sessions {
        workoutId
        date
        relative
        sets {
          setNumber
          reps
          weight
          rpe
        }
      }
    }
  }
`

export const GET_RUN_WORKOUT = gql`
  query GetRunWorkout($id: String!) {
    workout(id: $id) {
      id
      date
      dayOfWeek
      type
      notes
      completedAt
      runWorkout {
        id
        workoutType
        targetMiles
        targetPace
        heartRateZone
        actualMiles
        actualTime
        avgHeartRate
        maxHeartRate
        actualRPE
        notes
        completed
        completedAt
        segments {
          id order label type repeat
          distanceMi durationSec pace heartRateZone notes
        }
      }
    }
  }
`

export const LOG_SET = gql`
  mutation LogSet($setId: String!, $actualReps: String, $actualWeight: Float, $actualRPE: String, $notes: String) {
    logSet(setId: $setId, actualReps: $actualReps, actualWeight: $actualWeight, actualRPE: $actualRPE, notes: $notes) {
      id
      actualReps
      actualWeight
      actualRPE
      notes
    }
  }
`

export const COMPLETE_SET = gql`
  mutation CompleteSet($setId: String!) {
    completeSet(setId: $setId) {
      id
      completed
      completedAt
      actualReps
      actualWeight
      actualRPE
    }
  }
`

export const COMPLETE_WORKOUT = gql`
  mutation CompleteWorkout($workoutId: String!) {
    completeWorkout(workoutId: $workoutId) {
      id
      completedAt
    }
  }
`

export const LOG_RUN_WORKOUT = gql`
  mutation LogRunWorkout(
    $workoutId: String!
    $actualMiles: Float!
    $actualTime: Int!
    $avgHeartRate: Int
    $maxHeartRate: Int
    $actualRPE: Int
    $notes: String
  ) {
    logRunWorkout(
      workoutId: $workoutId
      actualMiles: $actualMiles
      actualTime: $actualTime
      avgHeartRate: $avgHeartRate
      maxHeartRate: $maxHeartRate
      actualRPE: $actualRPE
      notes: $notes
    ) {
      id
      completed
      completedAt
      actualMiles
      actualTime
      avgHeartRate
      maxHeartRate
      actualRPE
      notes
    }
  }
`

export const UNCOMPLETE_WORKOUT = gql`
  mutation UncompleteWorkout($workoutId: String!) {
    uncompleteWorkout(workoutId: $workoutId) {
      id
      completedAt
      runWorkout {
        id
        completed
        completedAt
      }
    }
  }
`

export const CREATE_RUN_WORKOUT = gql`
  mutation CreateRunWorkout($weekOf: String!, $date: String!, $targetMiles: Float, $targetPace: String) {
    createRunWorkout(weekOf: $weekOf, date: $date, targetMiles: $targetMiles, targetPace: $targetPace) {
      id
      date
      type
      runWorkout {
        id
        targetMiles
        targetPace
        heartRateZone
        completed
      }
    }
  }
`

export const CREATE_REST_WORKOUT = gql`
  mutation CreateRestWorkout($weekOf: String!, $date: String!, $notes: String) {
    createRestWorkout(weekOf: $weekOf, date: $date, notes: $notes) {
      id
      date
      type
    }
  }
`

export const CREATE_YOGA_WORKOUT = gql`
  mutation CreateYogaWorkout($weekOf: String!, $date: String!, $notes: String) {
    createYogaWorkout(weekOf: $weekOf, date: $date, notes: $notes) {
      id
      date
      type
    }
  }
`

export const UPDATE_EXERCISE = gql`
  mutation UpdateExercise($id: String!, $name: String!) {
    updateExercise(id: $id, name: $name) {
      id
      name
    }
  }
`

export const UPDATE_SET_TARGETS = gql`
  mutation UpdateSetTargets($id: String!, $targetReps: String, $targetWeight: Float, $targetRPE: String, $tempo: String) {
    updateSet(id: $id, targetReps: $targetReps, targetWeight: $targetWeight, targetRPE: $targetRPE, tempo: $tempo) {
      id
      targetReps
      targetWeight
      targetRPE
      tempo
    }
  }
`

export const ADD_SET = gql`
  mutation AddSet($exerciseId: String!) {
    addSet(exerciseId: $exerciseId) {
      id
      setNumber
      targetReps
      targetWeight
      targetRPE
      tempo
      actualReps
      actualWeight
      actualRPE
      notes
      completed
      completedAt
    }
  }
`

export const DELETE_SET = gql`
  mutation DeleteSet($id: String!) {
    deleteSet(id: $id)
  }
`
