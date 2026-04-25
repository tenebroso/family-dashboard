export const CheckIcon = ({ size = 14, color = 'currentColor', weight = 2 }: { size?: number; color?: string; weight?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12L13 4.5" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ChevronIcon = ({ dir = 'right', size = 16, color = 'currentColor' }: { dir?: 'left' | 'right' | 'up' | 'down'; size?: number; color?: string }) => {
  const rotation = { left: 180, right: 0, up: -90, down: 90 }[dir]
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ transform: `rotate(${rotation}deg)` }}>
      <path d="M6 3L11 8L6 13" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const PlusIcon = ({ size = 14, color = 'currentColor', weight = 1.6 }: { size?: number; color?: string; weight?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke={color} strokeWidth={weight} strokeLinecap="round" />
  </svg>
)

export const PencilIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M11 2.5L13.5 5L5.5 13L2.5 13.5L3 10.5L11 2.5Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)

export const CloseIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const RunIcon = ({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="2.2" stroke={color} strokeWidth="1.2" />
    <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="0.8" opacity="0.5" />
  </svg>
)

export const LiftIcon = ({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <rect x="1" y="4.5" width="10" height="3" stroke={color} strokeWidth="1.2" />
  </svg>
)

export const RestIcon = ({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6h8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

export const TrashIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5l.5-9" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const HeartIcon = ({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 10C6 10 1.5 7.5 1.5 4.5C1.5 3.12 2.62 2 4 2C4.83 2 5.55 2.41 6 3.04C6.45 2.41 7.17 2 8 2C9.38 2 10.5 3.12 10.5 4.5C10.5 7.5 6 10 6 10Z" stroke={color} strokeWidth="1.1" strokeLinejoin="round" />
  </svg>
)
