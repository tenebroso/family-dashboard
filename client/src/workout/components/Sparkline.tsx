import { C } from '../tokens'

interface SparklineProps {
  values: number[]
  w?: number
  h?: number
  color?: string
  fill?: boolean
}

export function Sparkline({ values, w = 64, h = 18, color = C.gold, fill = true }: SparklineProps) {
  if (!values || values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = w / (values.length - 1)
  const pts: Array<[number, number]> = values.map((v, i) => [
    i * step,
    h - 2 - ((v - min) / range) * (h - 4),
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const fillD = `${d} L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {fill && <path d={fillD} fill={color} fillOpacity="0.12" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 1.8 : 1} fill={color} opacity={i === pts.length - 1 ? 1 : 0.55} />
      ))}
    </svg>
  )
}
