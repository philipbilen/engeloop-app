"use client"

import { cn } from "@/lib/utils"
import type { ContractStatus } from "./contracts-table"

const statusOptions: Array<{ value: "all" | ContractStatus; label: string }> = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "executed", label: "Executed" },
    { value: "archived", label: "Archived" },
]

interface ContractStatusFiltersProps {
    value: "all" | ContractStatus
    onChange: (next: "all" | ContractStatus) => void
}

export function ContractStatusFilters({ value, onChange }: ContractStatusFiltersProps) {
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
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-full transition-all border shadow-sm",
                            isActive
                                ? "border-[color:rgba(var(--accent-primary-rgb),0.4)] bg-[color:rgba(var(--accent-primary-rgb),0.12)] text-[var(--accent-primary)] shadow-[0_4px_12px_rgba(79,70,229,0.12)]"
                                : "border-[var(--border-primary)] text-[var(--text-dim)] hover:border-[var(--accent-primary)]/45 hover:bg-[var(--bg-interactive)] hover:text-[var(--text-bright)]"
                        )}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
