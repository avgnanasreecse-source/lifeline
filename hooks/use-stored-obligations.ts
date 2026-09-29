'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { createDemoObligations, type Obligation } from '@/lib/obligations'

const STORAGE_KEY = 'lifeline:obligations:v1'

function isObligation(value: unknown): value is Obligation {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.title === 'string' && typeof v.dueDate === 'string'
}

function readStored(): Obligation[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isObligation) : null
  } catch {
    return null
  }
}

export function useStoredObligations(
  today: Date,
): [Obligation[], Dispatch<SetStateAction<Obligation[]>>, boolean] {
  const [items, setItems] = useState<Obligation[]>(() => createDemoObligations(today))
  const [loaded, setLoaded] = useState(false)

  // localStorage is only available after mount; reading it during render would break hydration.
  useEffect(() => {
    const stored = readStored()
    if (stored) setItems(stored)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage can be full or blocked (e.g. private mode); the app keeps working in memory.
    }
  }, [items, loaded])

  return [items, setItems, loaded]
}
