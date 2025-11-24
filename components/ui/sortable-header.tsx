"use client"

import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc"
export type SortOption<T extends string = string> = `${T}_${SortDirection}`

interface SortableHeaderProps<T extends string = string> {
  column: T
  label: string
  className?: string
  currentSort: SortOption<string>
  onSortChange: (next: SortOption<T>) => void
}

export function SortableHeader<T extends string = string>({ 
  column, 
  label, 
  className, 
  currentSort, 
  onSortChange 
}: SortableHeaderProps<T>) {
  // Parse current sort
  const [activeColumn, direction] = currentSort.split("_") as [string, SortDirection]
  const isActive = activeColumn === column
  const isAsc = direction === "asc"

  const handleClick = () => {
    let newSort: SortOption<T>
    if (isActive) {
      // Toggle direction
      newSort = `${column}_${isAsc ? "desc" : "asc"}` as SortOption<T>
    } else {
      // Default to asc for everything initially, can be customized if needed
      newSort = `${column}_asc` as SortOption<T>
    }

    onSortChange(newSort)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "font-semibold uppercase tracking-wide text-xs transition-colors hover:text-[var(--accent-primary)] text-left",
        isActive ? "text-[var(--text-bright)]" : "text-[var(--text-dimmer)]",
        className
      )}
    >
      {label}
      {isActive && (
        <span className="ml-1 text-[var(--accent-primary)]">
          {isAsc ? "↑" : "↓"}
        </span>
      )}
    </button>
  )
}
