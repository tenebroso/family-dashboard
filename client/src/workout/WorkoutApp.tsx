import { Routes, Route, Navigate } from 'react-router-dom'
import './workout.css'
import { C, F } from './tokens'
import { WeeklyCalendar } from './screens/WeeklyCalendar'
import { StrengthWorkout } from './screens/StrengthWorkout'
import { RunWorkout } from './screens/RunWorkout'
import { RestDay } from './screens/RestDay'

export function WorkoutApp() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: C.bg,
      color: C.text,
      fontFamily: F.dm,
    }}>
      <Routes>
        <Route index element={<WeeklyCalendar />} />
        <Route path="strength/:workoutId" element={<StrengthWorkout />} />
        <Route path="run/:workoutId" element={<RunWorkout />} />
        <Route path="rest/:workoutId" element={<RestDay />} />
        <Route path="*" element={<Navigate to="/workout" replace />} />
      </Routes>
    </div>
  )
}
