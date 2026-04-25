import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import dayjs from 'dayjs'
import { C, F } from '../tokens'
import { TopBar } from '../components/TopBar'
import { IconBtn } from '../components/IconBtn'
import { ChevronIcon } from '../icons'
import { GET_RUN_WORKOUT } from '../graphql'

export function RestDay() {
  const navigate = useNavigate()
  const { workoutId } = useParams<{ workoutId: string }>()

  const { data } = useQuery<{ workout: { id: string; date: string } | null }>(
    GET_RUN_WORKOUT,
    { variables: { id: workoutId }, skip: !workoutId }
  )

  const workout = data?.workout
  const dateLabel = workout ? dayjs(workout.date).format('ddd · MMM D').toUpperCase() : ''

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        eyebrow={dateLabel}
        title="Recovery"
        left={
          <IconBtn onClick={() => navigate(-1)}>
            <ChevronIcon dir="left" />
          </IconBtn>
        }
      />

      <div style={{
        flex: 1,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}>
        <div style={{
          fontFamily: F.syne,
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 0.9,
          letterSpacing: '-0.03em',
          color: C.gold,
        }}>
          Rest<br />Day.
        </div>
        <div style={{
          fontFamily: F.dm,
          fontSize: 15,
          color: C.muted,
          marginTop: 28,
          lineHeight: 1.6,
          maxWidth: 280,
        }}>
          Optional mobility work. Sleep, eat, walk. The plan resumes tomorrow.
        </div>
      </div>
    </div>
  )
}
