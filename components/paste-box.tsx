'use client'

import { useState, useTransition } from 'react'
import { ClipboardPaste, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseObligations } from '@/app/actions'
import { toISODate, type Obligation } from '@/lib/obligations'

const SAMPLES = [
  {
    label: 'Water bill SMS',
    text: 'Dear Customer, your BWSSB water bill of Rs. 420 for Account 88213 is generated. Please pay by the 6th of next month to avoid disconnection.',
  },
  {
    label: 'Car insurance notice',
    text: 'Your ICICI Lombard motor insurance policy MH-02-XX-4411 expires in 9 days. Renewal premium: INR 6,380. Renew now to keep your No Claim Bonus.',
  },
  {
    label: 'Spotify email',
    text: 'Hi! Your Spotify Premium Individual plan (₹119/month) will renew automatically in 3 days.',
  },
]

type Props = { today: Date; onAdded: (items: Obligation[]) => void }

export function PasteBox({ today, onAdded }: Props) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    setMessage(null)
    startTransition(async () => {
      const result = await parseObligations(text, toISODate(today))
      if (result.ok) {
        onAdded(result.items)
        setText('')
        setMessage({
          type: 'success',
          text: `Added ${result.items.length} item${result.items.length === 1 ? '' : 's'}: ${result.items
            .map((i) => i.title)
            .join(', ')}`,
        })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <section aria-labelledby="paste-heading" className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <ClipboardPaste className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 id="paste-heading" className="text-sm font-semibold">
          Paste a bill, SMS or notice
        </h2>
      </div>
      <form
        className="mt-3 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label htmlFor="paste-input" className="sr-only">
          Bill or notice text
        </label>
        <textarea
          id="paste-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="e.g. Your Tata Power bill of ₹2,310 is due on 15 Oct. Pay on time to avoid a late fee…"
          className="w-full resize-y rounded-xl border bg-background px-3 py-2.5 text-base leading-relaxed placeholder:text-muted-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setText(s.text)
                setMessage(null)
              }}
              className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary"
            >
              {s.label}
            </button>
          ))}
        </div>

        <Button type="submit" size="lg" disabled={isPending || text.trim().length < 8} className="h-11 w-full rounded-xl sm:w-auto sm:self-end">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Reading…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden="true" />
              Add to timeline
            </>
          )}
        </Button>

        <p
          role="status"
          aria-live="polite"
          className={
            message?.type === 'error' ? 'text-sm text-overdue' : 'text-sm text-later'
          }
        >
          {message?.text}
        </p>
      </form>
    </section>
  )
}
