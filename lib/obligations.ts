export const CATEGORIES = [
  'bill',
  'insurance',
  'subscription',
  'document',
  'appointment',
  'service',
  'other',
] as const

export type Category = (typeof CATEGORIES)[number]

export type Obligation = {
  id: string
  title: string
  category: Category
  dueDate: string
  amount: number | null
  provider: string | null
  note: string | null
}

export type Bucket = 'overdue' | 'thisWeek' | 'later'

export type Tip = {
  id: string
  tone: 'urgent' | 'save' | 'plan'
  title: string
  body: string
}

const DAY_MS = 86_400_000

export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysUntil(iso: string, today = new Date()) {
  return Math.round((parseISODate(iso).getTime() - startOfDay(today).getTime()) / DAY_MS)
}

export function getBucket(iso: string, today = new Date()): Bucket {
  const days = daysUntil(iso, today)
  if (days < 0) return 'overdue'
  if (days <= 7) return 'thisWeek'
  return 'later'
}

export function relativeLabel(iso: string, today = new Date()) {
  const days = daysUntil(iso, today)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return '1 day overdue'
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days < 60) return `In ${days} days`
  const months = Math.round(days / 30)
  return `In ${months} months`
}

export function formatDate(iso: string) {
  return parseISODate(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function offset(days: number, today: Date) {
  return toISODate(new Date(startOfDay(today).getTime() + days * DAY_MS))
}

export function createDemoObligations(today = new Date()): Obligation[] {
  return [
    {
      id: 'demo-electricity',
      title: 'Electricity bill',
      category: 'bill',
      dueDate: offset(-3, today),
      amount: 1840,
      provider: 'BESCOM',
      note: 'Late fee of ₹50 applies after due date',
    },
    {
      id: 'demo-doctor',
      title: 'Doctor appointment',
      category: 'appointment',
      dueDate: offset(1, today),
      amount: null,
      provider: 'Dr. Mehta, Apollo Clinic',
      note: 'Annual check-up at 10:30 AM. Carry old reports.',
    },
    {
      id: 'demo-credit-card',
      title: 'Credit card bill',
      category: 'bill',
      dueDate: offset(2, today),
      amount: 12450,
      provider: 'HDFC Bank',
      note: 'Minimum due ₹620',
    },
    {
      id: 'demo-netflix',
      title: 'Netflix renewal',
      category: 'subscription',
      dueDate: offset(4, today),
      amount: 649,
      provider: 'Netflix Standard plan',
      note: 'Auto-debit from card ending 4821',
    },
    {
      id: 'demo-broadband',
      title: 'Broadband bill',
      category: 'bill',
      dueDate: offset(5, today),
      amount: 999,
      provider: 'Airtel Xstream Fiber',
      note: null,
    },
    {
      id: 'demo-bike',
      title: 'Bike service',
      category: 'service',
      dueDate: offset(12, today),
      amount: 1500,
      provider: 'Honda Service Centre',
      note: 'Due at 12,000 km — oil change + chain',
    },
    {
      id: 'demo-lic',
      title: 'LIC premium',
      category: 'insurance',
      dueDate: offset(18, today),
      amount: 8750,
      provider: 'LIC Jeevan Anand · Policy 45xxxx12',
      note: '30-day grace period after due date',
    },
    {
      id: 'demo-passport',
      title: 'Passport expiry',
      category: 'document',
      dueDate: offset(95, today),
      amount: null,
      provider: 'Passport Seva',
      note: 'Many countries need 6 months validity to travel',
    },
  ]
}

export function sortByDate(items: Obligation[]) {
  return [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function groupByBucket(items: Obligation[], today = new Date()) {
  const groups: Record<Bucket, Obligation[]> = { overdue: [], thisWeek: [], later: [] }
  for (const item of sortByDate(items)) {
    groups[getBucket(item.dueDate, today)].push(item)
  }
  return groups
}

const PAYABLE: Category[] = ['bill', 'insurance', 'subscription']

export function buildTips(items: Obligation[], today = new Date()): Tip[] {
  const tips: Tip[] = []
  const groups = groupByBucket(items, today)

  for (const item of groups.overdue) {
    const days = Math.abs(daysUntil(item.dueDate, today))
    tips.push({
      id: `overdue-${item.id}`,
      tone: 'urgent',
      title: `${item.title} is ${days} day${days === 1 ? '' : 's'} overdue`,
      body: item.amount
        ? `Pay ${formatINR(item.amount)} today to avoid late fees or a service cut.`
        : 'Take care of this today before it causes trouble.',
    })
  }

  const billsThisWeek = groups.thisWeek.filter((i) => i.category === 'bill')
  if (billsThisWeek.length >= 2) {
    const total = billsThisWeek.reduce((sum, i) => sum + (i.amount ?? 0), 0)
    tips.push({
      id: 'bundle-bills',
      tone: 'plan',
      title: `${billsThisWeek.length} bills due this week, pay together`,
      body: `${billsThisWeek.map((b) => b.title).join(' + ')}${
        total ? ` = ${formatINR(total)}` : ''
      }. Clear them in one sitting and forget about it.`,
    })
  }

  const renewals = items.filter(
    (i) => i.category === 'subscription' && daysUntil(i.dueDate, today) >= 0 && daysUntil(i.dueDate, today) <= 10,
  )
  for (const sub of renewals) {
    const name = sub.title.replace(/\s*(renewal|subscription)$/i, '')
    const days = daysUntil(sub.dueDate, today)
    tips.push({
      id: `renew-${sub.id}`,
      tone: 'save',
      title: `${name} renews ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}, cancel to save money`,
      body: sub.amount
        ? `Not using it much? Cancelling saves ${formatINR(sub.amount)} a month — ${formatINR(sub.amount * 12)} a year.`
        : 'Not using it much? Cancel before the auto-debit.',
    })
  }

  const docs = items.filter(
    (i) => i.category === 'document' && daysUntil(i.dueDate, today) >= 0 && daysUntil(i.dueDate, today) <= 180,
  )
  for (const doc of docs) {
    tips.push({
      id: `doc-${doc.id}`,
      tone: 'plan',
      title: `${doc.title} in ${relativeLabel(doc.dueDate, today).replace('In ', '')}`,
      body: 'Renewals can take 3–6 weeks. Book your slot now so travel plans are not blocked.',
    })
  }

  const tomorrow = items.filter((i) => i.category === 'appointment' && daysUntil(i.dueDate, today) === 1)
  for (const appt of tomorrow) {
    tips.push({
      id: `appt-${appt.id}`,
      tone: 'plan',
      title: `${appt.title} is tomorrow`,
      body: appt.note ?? 'Set an alarm and keep the address handy.',
    })
  }

  const dueSoon = groups.thisWeek.filter((i) => PAYABLE.includes(i.category))
  const weekTotal = dueSoon.reduce((sum, i) => sum + (i.amount ?? 0), 0)
  if (weekTotal > 0) {
    tips.push({
      id: 'week-total',
      tone: 'plan',
      title: `Keep ${formatINR(weekTotal)} ready this week`,
      body: `That covers ${dueSoon.length} payment${dueSoon.length === 1 ? '' : 's'} due in the next 7 days.`,
    })
  }

  return tips
}
