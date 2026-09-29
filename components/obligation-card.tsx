import {
  Bike,
  Check,
  FileText,
  HeartPulse,
  Receipt,
  Repeat,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import {
  formatDate,
  formatINR,
  relativeLabel,
  type Bucket,
  type Category,
  type Obligation,
} from '@/lib/obligations'
import { cn } from '@/lib/utils'

const CATEGORY: Record<Category, { icon: LucideIcon; label: string }> = {
  bill: { icon: Receipt, label: 'Bill' },
  insurance: { icon: ShieldCheck, label: 'Insurance' },
  subscription: { icon: Repeat, label: 'Subscription' },
  document: { icon: FileText, label: 'Document' },
  appointment: { icon: Stethoscope, label: 'Appointment' },
  service: { icon: Bike, label: 'Service' },
  other: { icon: HeartPulse, label: 'Other' },
}

const BUCKET_STYLE: Record<Bucket, { accent: string; soft: string; text: string }> = {
  overdue: { accent: 'border-l-overdue', soft: 'bg-overdue-soft', text: 'text-overdue' },
  thisWeek: { accent: 'border-l-soon', soft: 'bg-soon-soft', text: 'text-soon' },
  later: { accent: 'border-l-later', soft: 'bg-later-soft', text: 'text-later' },
}

type Props = {
  item: Obligation
  bucket: Bucket
  today: Date
  isNew: boolean
  onDone: (id: string) => void
}

export function ObligationCard({ item, bucket, today, isNew, onDone }: Props) {
  const { icon: Icon, label } = CATEGORY[item.category] ?? CATEGORY.other
  const style = BUCKET_STYLE[bucket]
  const doneLabel = ['bill', 'insurance', 'subscription'].includes(item.category) ? 'Paid' : 'Done'

  return (
    <article
      className={cn(
        'flex gap-3 rounded-2xl border border-l-4 bg-card p-4 shadow-sm',
        style.accent,
        isNew && 'animate-in fade-in slide-in-from-bottom-2 ring-2 ring-ring/40 duration-500',
      )}
    >
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', style.soft, style.text)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{item.title}</h3>
            {item.provider && <p className="truncate text-xs text-muted-foreground">{item.provider}</p>}
          </div>
          {item.amount != null && (
            <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{formatINR(item.amount)}</p>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className={cn('rounded-full px-2 py-0.5 font-medium', style.soft, style.text)}>
            {relativeLabel(item.dueDate, today)}
          </span>
          <time dateTime={item.dueDate} className="text-muted-foreground">
            {formatDate(item.dueDate)}
          </time>
          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <span className="text-muted-foreground">{label}</span>
        </div>

        {item.note && <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">{item.note}</p>}
      </div>

      <button
        type="button"
        onClick={() => onDone(item.id)}
        aria-label={`Mark ${item.title} as ${doneLabel.toLowerCase()}`}
        className="flex size-9 shrink-0 items-center justify-center self-center rounded-full border text-muted-foreground transition-colors hover:border-later hover:bg-later-soft hover:text-later"
      >
        <Check className="size-4" aria-hidden="true" />
      </button>
    </article>
  )
}
