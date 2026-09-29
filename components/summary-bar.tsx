import { cn } from '@/lib/utils'

type Props = { overdue: number; thisWeek: number; later: number }

export function SummaryBar({ overdue, thisWeek, later }: Props) {
  const stats = [
    { href: '#overdue', label: 'Overdue', value: overdue, className: 'bg-overdue-soft text-overdue', dot: 'bg-overdue' },
    { href: '#this-week', label: 'This week', value: thisWeek, className: 'bg-soon-soft text-soon', dot: 'bg-soon' },
    { href: '#later', label: 'Later', value: later, className: 'bg-later-soft text-later', dot: 'bg-later' },
  ]

  return (
    <nav aria-label="Timeline summary" className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((s) => (
        <a
          key={s.href}
          href={s.href}
          className={cn(
            'flex flex-col gap-1 rounded-2xl px-3 py-3 transition-transform active:scale-[0.98] sm:px-4',
            s.className,
          )}
        >
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <span className={cn('size-2 rounded-full', s.dot)} aria-hidden="true" />
            {s.label}
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">{s.value}</span>
        </a>
      ))}
    </nav>
  )
}
