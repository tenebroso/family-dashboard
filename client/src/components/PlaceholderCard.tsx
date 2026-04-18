interface Props {
  label: string
  className?: string
}

export default function PlaceholderCard({ label, className = '' }: Props) {
  return (
    <div
      className={`bg-surface-raised border border-gold/15 rounded-xl p-5 flex items-center justify-center shadow-[0_4px_24px_rgba(201,168,76,0.05)] ${className}`}
    >
      <span className="font-display text-sm font-bold tracking-widest uppercase text-ink-muted/50">
        {label}
      </span>
    </div>
  )
}
