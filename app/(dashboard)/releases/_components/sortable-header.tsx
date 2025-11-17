"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export type SortColumn = "release_date" | "title" | "status"
export type SortDirection = "asc" | "desc"
export type SortOption = `${SortColumn}_${SortDirection}`

interface SortableHeaderProps {
  column: SortColumn
  label: string
  className?: string
}

export function SortableHeader({ column, label, className }: SortableHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get("sort") || "release_date_desc") as SortOption

  // Parse current sort
  const [activeColumn, direction] = currentSort.split("_") as [SortColumn, SortDirection]
  const isActive = activeColumn === column
  const isAsc = direction === "asc"

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString())

    let newSort: SortOption
    if (isActive) {
      // Toggle direction
      newSort = `${column}_${isAsc ? "desc" : "asc"}`
    } else {
      // First click: dates desc, text asc
      newSort = column === "release_date" ? `${column}_desc` : `${column}_asc`
    }

    params.set("sort", newSort)
    router.replace(`/releases?${params.toString()}`)
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
