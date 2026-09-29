import type { Bucket, Obligation } from '@/lib/obligations'
import { ObligationCard } from '@/components/obligation-card'
import { cn } from '@/lib/utils'

const SECTIONS: { bucket: Bucket; id: string; title: string; subtitle: string; dot: string; text: string }[] = [
  { bucket: 'overdue', id: 'overdue', title: 'Overdue', subtitle: 'Needs action now', dot: 'bg-overdue', text: 'text-overdue' },
  { bucket: 'thisWeek', id: 'this-week', title: 'This Week', subtitle: 'Next 7 days', dot: 'bg-soon', text: 'text-soon' },
  { bucket: 'later', id: 'later', title: 'Later', subtitle: 'Coming up', dot: 'bg-later', text: 'text-later' },
]

type Props = {
  groups: Record<Bucket, Obligation[]>
  today: Date
  highlightIds: string[]
  onDone: (id: string) => void
}

export function Timeline({ groups, today, highlightIds, onDone }: Props) {
  return (
    <section aria-label="Obligations timeline" className="flex flex-col gap-8">
      {SECTIONS.map((section) => {
        const items = groups[section.bucket]
        return (
          <div key={section.bucket} id={section.id} className="scroll-mt-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <span className={cn('size-2.5 rounded-full', section.dot)} aria-hidden="true" />
                <span className={section.text}>{section.title}</span>
                <span className="font-mono text-sm font-normal text-muted-foreground">{items.length}</span>
              </h2>
              <span className="text-xs text-muted-foreground">{section.subtitle}</span>
            </div>

            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                {section.bucket === 'overdue' ? 'Nothing overdue. Nice work.' : 'Nothing here yet.'}
              </p>
            ) : (
              <ol className="relative flex flex-col gap-3 pl-5">
                <span className={cn('absolute bottom-3 left-[5px] top-3 w-px opacity-30', section.dot)} aria-hidden="true" />
                {items.map((item) => (
                  <li key={item.id} className="relative">
                    <span
                      className={cn(
                        'absolute -left-5 top-5 size-[11px] rounded-full border-2 border-background',
                        section.dot,
                      )}
                      aria-hidden="true"
                    />
                    <ObligationCard
                      item={item}
                      bucket={section.bucket}
                      today={today}
                      isNew={highlightIds.includes(item.id)}
                      onDone={onDone}
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        )
      })}
    </section>
  )
}
