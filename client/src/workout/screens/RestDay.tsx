import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import dayjs from 'dayjs'
import { C, F } from '../tokens'
import { TopBar } from '../components/TopBar'
import { IconBtn } from '../components/IconBtn'
import { PrimaryBtn } from '../components/PrimaryBtn'
import { ChevronIcon } from '../icons'
import { GET_RUN_WORKOUT, COMPLETE_WORKOUT, UNCOMPLETE_WORKOUT } from '../graphql'

function hapticLight() {
  if ('vibrate' in navigator) navigator.vibrate(10)
}

export function RestDay() {
  const navigate = useNavigate()
  const { workoutId } = useParams<{ workoutId: string }>()

  const { data } = useQuery<{ workout: { id: string; date: string; completedAt: string | null } | null }>(
    GET_RUN_WORKOUT,
    { variables: { id: workoutId }, fetchPolicy: 'cache-and-network', skip: !workoutId }
  )

  const [completeWorkoutMutation] = useMutation(COMPLETE_WORKOUT)
  const [uncompleteWorkoutMutation] = useMutation(UNCOMPLETE_WORKOUT)

  const workout = data?.workout
  const isComplete = !!workout?.completedAt
  const dateLabel = workout ? dayjs(workout.date).format('ddd · MMM D').toUpperCase() : ''

  const handleToggle = async () => {
    if (!workout) return
    hapticLight()
    try {
      if (isComplete) {
        await uncompleteWorkoutMutation({
          variables: { workoutId: workout.id },
          refetchQueries: ['GetTrainingWeekCalendar'],
        })
      } else {
        await completeWorkoutMutation({
          variables: { workoutId: workout.id },
          refetchQueries: ['GetTrainingWeekCalendar'],
        })
      }
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        eyebrow={dateLabel}
        title="Rest Day"
        left={
          <IconBtn onClick={() => navigate(-1)}>
            <ChevronIcon dir="left" />
          </IconBtn>
        }
      />

      {isComplete && (
        <div style={{
          padding: '10px 20px',
          background: 'rgba(255,74,28,0.06)',
          borderBottom: `1px solid ${C.hair}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em', color: C.gold }}>✓ DAY COMPLETE</span>
          <button
            onClick={handleToggle}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: F.mono,
              fontSize: 9,
              letterSpacing: '0.14em',
              color: C.muted,
              cursor: 'pointer',
              padding: '4px 0',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            MARK INCOMPLETE
          </button>
        </div>
      )}

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
          color: isComplete ? C.gold : C.text,
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

      {!isComplete && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: '12px 20px',
          paddingBottom: 'max(44px, env(safe-area-inset-bottom, 44px))',
          background: `linear-gradient(180deg, rgba(244,240,232,0) 0%, rgba(244,240,232,0.92) 28%, ${C.bg} 100%)`,
        }}>
          <PrimaryBtn onClick={handleToggle}>Mark Day Complete</PrimaryBtn>
        </div>
      )}
    </div>
  )
}
