"use client"

import { useEffect, useRef, useState } from "react"

export interface UseAutosaveOptions<T> {
  value: T
  onSave: (value: T) => Promise<void>
  delay?: number
  enabled?: boolean
}

export interface UseAutosaveReturn {
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
}

export function useAutosave<T>({
  value,
  onSave,
  delay = 500,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout>()
  const previousValueRef = useRef<T>(value)

  useEffect(() => {
    if (!enabled) return

    // Don't save if value hasn't changed
    if (JSON.stringify(value) === JSON.stringify(previousValueRef.current)) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      setError(null)

      try {
        await onSave(value)
        setLastSaved(new Date())
        previousValueRef.current = value
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Save failed"))
      } finally {
        setIsSaving(false)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, onSave, delay, enabled])

  return { isSaving, lastSaved, error }
}
