'use client'

import { useMemo, useState } from 'react'
import { Activity } from 'lucide-react'
import { buildTips, createDemoObligations, groupByBucket, type Obligation } from '@/lib/obligations'
import { PasteBox } from '@/components/paste-box'
import { SmartTips } from '@/components/smart-tips'
import { SummaryBar } from '@/components/summary-bar'
import { Timeline } from '@/components/timeline'
import { useStoredObligations } from '@/hooks/use-stored-obligations'

export function LifeLineApp() {
  const [today] = useState(() => new Date())
  const [items, setItems] = useStoredObligations(today)
  const [highlightIds, setHighlightIds] = useState<string[]>([])

  const groups = useMemo(() => groupByBucket(items, today), [items, today])
  const tips = useMemo(() => buildTips(items, today), [items, today])

  function handleAdded(newItems: Obligation[]) {
    setItems((prev) => [...prev, ...newItems])
    setHighlightIds(newItems.map((i) => i.id))
  }

  function handleDone(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleReset() {
    setItems(createDemoObligations(today))
    setHighlightIds([])
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-none tracking-tight">LifeLine</h1>
            <p className="mt-1 text-xs text-muted-foreground">Every due date, one timeline</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Reset demo
        </button>
      </header>

      <main className="flex flex-col gap-6">
        <SummaryBar
          overdue={groups.overdue.length}
          thisWeek={groups.thisWeek.length}
          later={groups.later.length}
        />
        <PasteBox today={today} onAdded={handleAdded} />
        <SmartTips tips={tips} />
        <Timeline groups={groups} today={today} highlightIds={highlightIds} onDone={handleDone} />
      </main>
    </div>
  )
}
