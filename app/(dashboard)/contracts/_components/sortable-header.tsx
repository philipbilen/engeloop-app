"use client"

import { cn } from "@/lib/utils"

export type SortColumn = "updated_at" | "licensors" | "status" | "type" | "pool_percent"
export type SortDirection = "asc" | "desc"
export type SortOption = `${SortColumn}_${SortDirection}`

interface SortableHeaderProps {
    column: SortColumn
    label: string
    className?: string
    currentSort: SortOption
    onSortChange: (next: SortOption) => void
}

export function SortableHeader({ column, label, className, currentSort, onSortChange }: SortableHeaderProps) {
    // Parse current sort
    const [activeColumn, direction] = currentSort.split("_") as [SortColumn, SortDirection]
    const isActive = activeColumn === column
    const isAsc = direction === "asc"

    const handleClick = () => {
        let newSort: SortOption
        if (isActive) {
            // Toggle direction
            newSort = `${column}_${isAsc ? "desc" : "asc"}`
        } else {
            // First click: dates/numbers desc, text asc
            if (column === "updated_at" || column === "pool_percent") {
                newSort = `${column}_desc`
            } else {
                newSort = `${column}_asc`
            }
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
