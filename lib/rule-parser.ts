import { toISODate, type Category, type Obligation } from '@/lib/obligations'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const KNOWN: { pattern: RegExp; title: string; category: Category }[] = [
  { pattern: /netflix/i, title: 'Netflix renewal', category: 'subscription' },
  { pattern: /spotify/i, title: 'Spotify renewal', category: 'subscription' },
  { pattern: /prime video|amazon prime/i, title: 'Amazon Prime renewal', category: 'subscription' },
  { pattern: /hotstar|jiocinema|youtube premium/i, title: 'Streaming renewal', category: 'subscription' },
  { pattern: /\bLIC\b/, title: 'LIC premium', category: 'insurance' },
  { pattern: /motor insurance|car insurance|bike insurance/i, title: 'Vehicle insurance renewal', category: 'insurance' },
  { pattern: /health insurance|mediclaim/i, title: 'Health insurance premium', category: 'insurance' },
  { pattern: /insurance|premium|policy/i, title: 'Insurance premium', category: 'insurance' },
  { pattern: /passport/i, title: 'Passport expiry', category: 'document' },
  { pattern: /driving licen[cs]e|\bDL\b/i, title: 'Driving licence expiry', category: 'document' },
  { pattern: /\bPUC\b|pollution/i, title: 'PUC certificate expiry', category: 'document' },
  { pattern: /doctor|dr\.|clinic|hospital|appointment/i, title: 'Doctor appointment', category: 'appointment' },
  { pattern: /electricity|power|bescom|msedcl|tata power|adani/i, title: 'Electricity bill', category: 'bill' },
  { pattern: /water|bwssb/i, title: 'Water bill', category: 'bill' },
  { pattern: /\bgas\b|piped|lpg/i, title: 'Gas bill', category: 'bill' },
  { pattern: /broadband|fiber|fibre|wifi|internet/i, title: 'Broadband bill', category: 'bill' },
  { pattern: /credit card/i, title: 'Credit card bill', category: 'bill' },
  { pattern: /postpaid|mobile|recharge/i, title: 'Mobile bill', category: 'bill' },
  { pattern: /\brent\b/i, title: 'Rent', category: 'bill' },
  { pattern: /\bemi\b|loan/i, title: 'Loan EMI', category: 'bill' },
  { pattern: /\b(bike|car|scooter|vehicle)\b.*servic|servicing|service due/i, title: 'Vehicle service', category: 'service' },
  { pattern: /subscription|renew/i, title: 'Subscription renewal', category: 'subscription' },
  { pattern: /bill|due|pay/i, title: 'Bill payment', category: 'bill' },
]

const PROVIDERS = /\b(BESCOM|BWSSB|MSEDCL|Tata Power|Adani|Airtel|Jio|Vi|BSNL|HDFC|ICICI Lombard|ICICI|SBI|Axis|Kotak|LIC|Netflix|Spotify|Apollo|Honda|Hero|Bajaj|TVS)\b/i

function addDays(base: Date, days: number) {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days)
}

function nextOccurrence(month: number, day: number, today: Date, year?: number) {
  if (year) return new Date(year < 100 ? 2000 + year : year, month, day)
  const candidate = new Date(today.getFullYear(), month, day)
  return candidate < addDays(today, -30) ? new Date(today.getFullYear() + 1, month, day) : candidate
}

function findDate(text: string, today: Date): Date | null {
  const t = text.toLowerCase()

  if (/\btoday\b/.test(t)) return today
  if (/\btomorrow\b/.test(t)) return addDays(today, 1)

  const rel = t.match(/in\s+(\d{1,3})\s+(day|week|month)s?/)
  if (rel) {
    const n = Number(rel[1])
    if (rel[2] === 'day') return addDays(today, n)
    if (rel[2] === 'week') return addDays(today, n * 7)
    return new Date(today.getFullYear(), today.getMonth() + n, today.getDate())
  }

  const nextMonth = t.match(/(\d{1,2})(?:st|nd|rd|th)?\s+of\s+next\s+month/)
  if (nextMonth) return new Date(today.getFullYear(), today.getMonth() + 1, Number(nextMonth[1]))

  const numeric = t.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/)
  if (numeric) return nextOccurrence(Number(numeric[2]) - 1, Number(numeric[1]), today, Number(numeric[3]))

  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))

  const monthNames = MONTHS.join('|')
  const dayMonth = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})[a-z]*\\.?,?\\s*(\\d{4})?`))
  if (dayMonth) {
    return nextOccurrence(MONTHS.indexOf(dayMonth[2]), Number(dayMonth[1]), today, dayMonth[3] ? Number(dayMonth[3]) : undefined)
  }

  const monthDay = t.match(new RegExp(`\\b(${monthNames})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?`))
  if (monthDay) {
    return nextOccurrence(MONTHS.indexOf(monthDay[1]), Number(monthDay[2]), today, monthDay[3] ? Number(monthDay[3]) : undefined)
  }

  return null
}

function findAmount(text: string): number | null {
  const match = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i) ?? text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:rupees|\/-)/i)
  if (!match) return null
  const value = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null
}

export function parseWithRules(text: string, today: Date): Obligation[] {
  const date = findDate(text, today)
  if (!date || Number.isNaN(date.getTime())) return []

  const known = KNOWN.find((k) => k.pattern.test(text)) ?? { title: 'Reminder', category: 'other' as Category }
  const provider = text.match(PROVIDERS)?.[1] ?? null
  const firstSentence = text.split(/(?<=[.!?])\s+/).find((s) => /late|fee|disconnect|grace|bonus|carry|\d\s?(am|pm)\b/i.test(s))

  return [
    {
      id: crypto.randomUUID(),
      title: known.title,
      category: known.category,
      dueDate: toISODate(date),
      amount: findAmount(text),
      provider,
      note: firstSentence && firstSentence.length <= 140 ? firstSentence.trim() : null,
    },
  ]
}
