import { personTypeDefs } from './types/person.graphql'
import { choreTypeDefs } from './types/chore.graphql'
import { calendarTypeDefs } from './types/calendar.graphql'
import { weatherTypeDefs } from './types/weather.graphql'
import { messageTypeDefs } from './types/message.graphql'
import { trackTypeDefs } from './types/track.graphql'
import { wordTypeDefs } from './types/word.graphql'
import { groceryTypeDefs } from './types/grocery.graphql'
import { reminderTypeDefs } from './types/reminder.graphql'
import { workoutTypeDefs } from './types/workouts.graphql'

const rootTypeDefs = `#graphql
  type Query {
    ping: String!
    people: [Person!]!
    person(id: ID!): Person
    calendarEvents(start: String!, end: String!): [CalendarEvent!]!
    weather: WeatherData!
    messages(limit: Int, personSlug: String): [Message!]!
    dailyTrack: Track!
    wordOfDay: WordOfDay!
    groceryItems: [GroceryItem!]!
    reminders(personId: ID!): [Reminder!]!
    trainingWeek(weekOf: String!): TrainingWeek
    workout(id: String!): Workout
    weekWorkouts(weekOf: String!): [Workout!]!
    workoutExerciseHistory(workoutId: String!, limit: Int): [ExerciseHistory!]!
  }

  type Mutation {
    completeChore(choreId: ID!, dateKey: String!): ChoreCompletion!
    uncompleteChore(choreId: ID!, dateKey: String!): Boolean!
    createChore(input: CreateChoreInput!): Chore!
    updateChore(input: UpdateChoreInput!): Chore!
    deleteChore(id: ID!): Boolean!
    sendMessage(body: String!, personSlug: String!): Message!
    deleteMessage(id: ID!): Boolean!
    addGroceryItem(name: String!, quantity: String, category: String, addedBy: String!): GroceryItem!
    toggleGroceryItem(id: ID!): GroceryItem!
    deleteGroceryItem(id: ID!): Boolean!
    clearCheckedGroceryItems: Int!
    addReminder(personId: ID!, text: String!, dueDate: String): Reminder!
    toggleReminder(id: ID!): Reminder!
    deleteReminder(id: ID!): Boolean!
    uploadTrainingPDF(pdfPath: String!, weekOf: String!): TrainingWeek!
    logSet(setId: String!, actualReps: String, actualWeight: Float, actualRPE: String, notes: String): StrengthSet!
    completeSet(setId: String!): StrengthSet!
    uncompleteSet(setId: String!): StrengthSet!
    createRunWorkout(weekOf: String!, date: String!, targetMiles: Float, targetPace: String): Workout!
    logRunWorkout(workoutId: String!, actualMiles: Float!, actualTime: Int!, avgHeartRate: Int, maxHeartRate: Int, actualRPE: Int, notes: String): RunWorkout!
    completeWorkout(workoutId: String!): Workout!
    uncompleteWorkout(workoutId: String!): Workout!
    createRestWorkout(weekOf: String!, date: String!, notes: String): Workout!
    createYogaWorkout(weekOf: String!, date: String!, notes: String): Workout!
    updateWorkoutNotes(workoutId: String!, notes: String!): Workout!
    updateExercise(id: String!, name: String!): StrengthExercise!
    updateSet(id: String!, targetReps: String, targetWeight: Float, targetRPE: String, tempo: String): StrengthSet!
    addSet(exerciseId: String!): StrengthSet!
    deleteSet(id: String!): Boolean!
    generateWeeklySummary(weekOf: String!): String!
  }
`

export const typeDefs = [
  rootTypeDefs,
  personTypeDefs,
  choreTypeDefs,
  calendarTypeDefs,
  weatherTypeDefs,
  messageTypeDefs,
  trackTypeDefs,
  wordTypeDefs,
  groceryTypeDefs,
  reminderTypeDefs,
  workoutTypeDefs,
]
