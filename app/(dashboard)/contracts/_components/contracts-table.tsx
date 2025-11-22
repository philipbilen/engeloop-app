"use client"

import { memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/ui/badge"
import type { ReleaseStatus } from "@/components/ui/badge" // We might need a ContractStatus type later
import { cn } from "@/lib/utils"

// TODO: Move to a shared types file
export type ContractStatus = "draft" | "sent" | "executed" | "archived"
export type ContractType = "MLA" | "Release Schedule" | "Remix Agreement" | "Other"

export interface ContractRow {
    id: string
    licensors: string[]
    type: ContractType
    status: ContractStatus
    pool_percent: number | null
    linked_releases_count: number
    last_updated: string
}

interface ContractsTableProps {
    contracts: ContractRow[]
}

function formatLastUpdated(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const ContractRowComponent = memo(function ContractRow({
    contract,
}: {
    contract: ContractRow
}) {
    const router = useRouter()

    const handleClick = useCallback(() => {
        router.push(`/contracts/${contract.id}`)
    }, [router, contract.id])

    const formattedDate = useMemo(() => formatLastUpdated(contract.last_updated), [contract.last_updated])

    const licensorDisplay = useMemo(() => {
        if (contract.licensors.length === 0) return "Unknown"
        return contract.licensors.join(", ")
    }, [contract.licensors])

    return (
        <tr
            onClick={handleClick}
            className="border-b last:border-0 transition-colors hover:bg-[var(--bg-interactive)] cursor-pointer group"
            style={{ borderColor: "var(--border-primary)" }}
        >
            {/* ID - Monospace */}
            <td className="px-4 py-4 table-cell align-middle">
                <span className="font-mono text-xs text-[var(--text-dimmer)]">
                    {contract.id.slice(0, 8)}...
                </span>
            </td>

            {/* Licensor */}
            <td className="px-4 py-4 table-cell align-middle max-w-[250px]">
                <div className="text-[var(--text-bright)] font-semibold truncate" title={contract.licensors.join(", ")}>
                    {licensorDisplay}
                </div>
            </td>

            {/* Type */}
            <td className="px-4 py-4 text-[var(--text-dim)] text-sm table-cell align-middle">
                {contract.type}
            </td>

            {/* Status */}
            <td className="px-4 py-4 table-cell align-middle">
                {/* Reusing StatusBadge for now, might need specific ContractStatusBadge */}
                <StatusBadge status={contract.status as any} />
            </td>

            {/* Pool % */}
            <td className="px-4 py-4 text-[var(--text-dim)] text-sm font-mono table-cell align-middle">
                {contract.pool_percent !== null ? `${contract.pool_percent}%` : "—"}
            </td>

            {/* Linked Releases */}
            <td className="px-4 py-4 text-[var(--text-dim)] text-sm table-cell align-middle">
                {contract.linked_releases_count}
            </td>

            {/* Last Updated */}
            <td className="px-4 py-4 text-[var(--text-dimmer)] text-xs table-cell align-middle">
                {formattedDate}
            </td>
        </tr>
    )
})

ContractRowComponent.displayName = "ContractRow"

import { SortableHeader, type SortOption } from "./sortable-header"

interface ContractsTableProps {
    contracts: ContractRow[]
    currentSort: SortOption
    onSortChange: (next: SortOption) => void
}

export function ContractsTable({ contracts, currentSort, onSortChange }: ContractsTableProps) {
    return (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-white shadow-[var(--shadow-card)]">
            <table className="w-full border-collapse text-left">
                <thead
                    className="border-b-2 bg-[var(--bg-tertiary)]"
                    style={{ borderColor: "var(--border-primary)" }}
                >
                    <tr>
                        <th className="px-4 py-3 text-left w-24">
                            <span className="font-semibold uppercase tracking-wide text-xs text-[var(--text-dimmer)]">
                                ID
                            </span>
                        </th>
                        <th className="px-4 py-3 text-left">
                            <SortableHeader
                                column="licensors"
                                label="Licensor"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                        <th className="px-4 py-3 text-left w-32">
                            <SortableHeader
                                column="type"
                                label="Type"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                        <th className="px-4 py-3 text-left w-32">
                            <SortableHeader
                                column="status"
                                label="Status"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                        <th className="px-4 py-3 text-left w-24">
                            <SortableHeader
                                column="pool_percent"
                                label="Pool %"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                        <th className="px-4 py-3 text-left w-24">
                            <span className="font-semibold uppercase tracking-wide text-xs text-[var(--text-dimmer)]">
                                Releases
                            </span>
                        </th>
                        <th className="px-4 py-3 text-left w-32">
                            <SortableHeader
                                column="updated_at"
                                label="Updated"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody className="border-separate border-spacing-0">
                    {contracts.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-4 py-12 text-center text-[var(--text-dimmer)]"
                            >
                                No contracts found
                            </td>
                        </tr>
                    ) : (
                        contracts.map((contract) => (
                            <ContractRowComponent
                                key={contract.id}
                                contract={contract}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
