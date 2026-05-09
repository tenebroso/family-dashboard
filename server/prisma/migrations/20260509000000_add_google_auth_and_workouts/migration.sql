-- AlterTable: add Google OAuth fields to Person
ALTER TABLE "Person" ADD COLUMN "email" TEXT;
ALTER TABLE "Person" ADD COLUMN "googleId" TEXT;

-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Athlete_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingWeek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "weekOf" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingWeek_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainingWeekId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workout_trainingWeekId_fkey" FOREIGN KEY ("trainingWeekId") REFERENCES "TrainingWeek" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrengthExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "loadingNote" TEXT,
    "coachNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StrengthExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrengthSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "targetReps" TEXT,
    "targetWeight" REAL,
    "targetRPE" TEXT,
    "tempo" TEXT,
    "actualReps" TEXT,
    "actualWeight" REAL,
    "actualRPE" TEXT,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "StrengthSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "StrengthExercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunWorkout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "targetMiles" REAL,
    "targetPace" TEXT,
    "heartRateZone" TEXT,
    "workoutType" TEXT,
    "actualMiles" REAL,
    "actualTime" INTEGER,
    "avgHeartRate" INTEGER,
    "maxHeartRate" INTEGER,
    "actualRPE" INTEGER,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "RunWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunSegment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runWorkoutId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "repeat" INTEGER,
    "distanceMi" REAL,
    "durationSec" INTEGER,
    "pace" TEXT,
    "heartRateZone" TEXT,
    "notes" TEXT,
    CONSTRAINT "RunSegment_runWorkoutId_fkey" FOREIGN KEY ("runWorkoutId") REFERENCES "RunWorkout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_personId_key" ON "Athlete"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingWeek_athleteId_weekOf_key" ON "TrainingWeek"("athleteId", "weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "RunWorkout_workoutId_key" ON "RunWorkout"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_googleId_key" ON "Person"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");
