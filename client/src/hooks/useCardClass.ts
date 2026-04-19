import { useAerial } from '../contexts/AerialContext'

export function useCardClass(extra = '') {
  const aerial = useAerial()
  const base = aerial
    ? 'backdrop-blur-md bg-black/50 rounded-lg ring-1 ring-white/10'
    : 'bg-surface-raised rounded-lg'
  return extra ? `${base} ${extra}` : base
}
