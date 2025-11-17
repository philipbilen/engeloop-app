"use client"

import { UseAutosaveReturn } from "@/lib/hooks/use-autosave"

interface AutosaveIndicatorProps {
  autosave: UseAutosaveReturn
}

export function AutosaveIndicator({ autosave }: AutosaveIndicatorProps) {
  const { isSaving, lastSaved, error } = autosave

  if (error) {
    return (
      <div className="flex items-center gap-2 text-[var(--accent-danger)] text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-danger)]"></span>
        <span>Save failed: {error.message}</span>
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>
        <span>Saving...</span>
      </div>
    )
  }

  if (lastSaved) {
    const timeString = lastSaved.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    return (
      <div className="flex items-center gap-2 text-[var(--accent-success)] text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-success)]"></span>
        <span>Saved at {timeString}</span>
      </div>
    )
  }

  return null
}
