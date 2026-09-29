'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { CATEGORIES, type Obligation } from '@/lib/obligations'
import { parseWithRules } from '@/lib/rule-parser'

const extractionSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().describe('Short human title, e.g. "Electricity bill", "Netflix renewal", "Passport expiry"'),
      category: z.enum(CATEGORIES),
      dueDate: z.string().describe('Due, renewal, expiry or appointment date in YYYY-MM-DD'),
      amount: z.number().nullable().describe('Amount payable in INR, null if none'),
      provider: z.string().nullable().describe('Company, doctor, or issuer'),
      note: z.string().nullable().describe('One short useful detail, e.g. late fee, time, policy number'),
    }),
  ),
})

type ParseResult = { ok: true; items: Obligation[] } | { ok: false; error: string }

export async function parseObligations(text: string, today: string): Promise<ParseResult> {
  const input = text.trim()
  if (input.length < 8) return { ok: false, error: 'Paste a bit more text from your bill or notice.' }
  if (input.length > 8000) return { ok: false, error: 'That is too long. Paste up to 8,000 characters at a time.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return { ok: false, error: 'Invalid date.' }

  try {
    const { output } = await generateText({
      model: 'google/gemini-3.5-flash',
      output: Output.object({ schema: extractionSchema }),
      system:
        'You extract obligations (bills, premiums, subscriptions, document expiries, appointments, services) from pasted text of Indian bills, SMS and notices. Today is ' +
        today +
        '. Resolve relative dates ("in 5 days", "next Monday") against today. If a year is missing, pick the next upcoming occurrence. Ignore text that contains no dated obligation. Return an empty list if nothing is found.',
      prompt: input,
    })

    const items: Obligation[] = output.items
      .filter((i) => /^\d{4}-\d{2}-\d{2}$/.test(i.dueDate))
      .map((i) => ({ ...i, id: crypto.randomUUID() }))

    if (items.length === 0) {
      return { ok: false, error: 'No due date found. Make sure the text includes a date.' }
    }
    return { ok: true, items }
  } catch (error) {
    console.error('[lifeline] AI parse failed, using rule-based parser:', (error as Error).message)
    const [y, m, d] = today.split('-').map(Number)
    const items = parseWithRules(input, new Date(y, m - 1, d))
    if (items.length === 0) {
      return { ok: false, error: 'No due date found. Make sure the text includes a date.' }
    }
    return { ok: true, items }
  }
}
