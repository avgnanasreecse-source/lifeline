import { AlertTriangle, CalendarClock, PiggyBank, Lightbulb } from 'lucide-react'
import type { Tip } from '@/lib/obligations'
import { cn } from '@/lib/utils'

const TONE = {
  urgent: { icon: AlertTriangle, className: 'bg-overdue-soft text-overdue' },
  save: { icon: PiggyBank, className: 'bg-later-soft text-later' },
  plan: { icon: CalendarClock, className: 'bg-soon-soft text-soon' },
} as const

export function SmartTips({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) return null

  return (
    <section aria-labelledby="tips-heading">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 id="tips-heading" className="text-sm font-semibold">
          Smart tips
        </h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {tips.length}
        </span>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
        {tips.map((tip) => {
          const { icon: Icon, className } = TONE[tip.tone]
          return (
            <li
              key={tip.id}
              className="flex w-[78%] shrink-0 snap-start gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:w-auto"
            >
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', className)}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-pretty">{tip.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{tip.body}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
