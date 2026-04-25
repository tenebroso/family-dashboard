import { C } from '../tokens'
import { CheckIcon } from '../icons'

type RingState = 'complete' | 'partial' | 'empty'

export function CompletionRing({ state }: { state: RingState }) {
  return (
    <div style={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      border: `1.5px solid ${state === 'empty' ? C.muted2 : C.gold}`,
      background: state === 'complete' ? C.gold : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {state === 'complete' && <CheckIcon size={11} color={C.bg} weight={2.4} />}
      {state === 'partial' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold }} />}
    </div>
  )
}
