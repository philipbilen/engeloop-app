"use client"

import { cn } from "@/lib/utils"
import type { ReleaseStatus } from "@/components/ui/badge"

const statusOptions: Array<{ value: "all" | ReleaseStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "planning", label: "Planning" },
  { value: "signed", label: "Signed" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready_for_delivery", label: "Ready for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "released", label: "Released" },
  { value: "archived", label: "Archived" },
]

interface StatusFiltersProps {
  value: "all" | ReleaseStatus
  onChange: (next: "all" | ReleaseStatus) => void
}

export function StatusFilters({ value, onChange }: StatusFiltersProps) {
  const currentStatus = value

  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((option) => {
        const isActive = currentStatus === option.value

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium uppercase tracking-wide rounded transition-colors border-2",
              isActive
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "border-[var(--border-primary)] text-[var(--text-dim)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--text-bright)]"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
