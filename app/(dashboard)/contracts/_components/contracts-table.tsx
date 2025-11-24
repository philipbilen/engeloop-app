"use client"

import { memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/ui/badge"
import { SortableHeader, type SortOption } from "@/components/ui/sortable-header"
import { cn } from "@/lib/utils"

// TODO: Move to a shared types file
export type ContractStatus = "draft" | "sent" | "executed" | "archived"
export type ContractType = "MLA" | "Release Schedule" | "Remix Agreement" | "Other"

export type ContractSortColumn = "licensors" | "type" | "status" | "pool_percent" | "updated_at"
export type ContractSortOption = SortOption<ContractSortColumn>

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
    currentSort: ContractSortOption
    onSortChange: (next: ContractSortOption) => void
    onSelectContract?: (id: string) => void
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
    onSelect,
}: {
    contract: ContractRow
    onSelect?: (id: string) => void
}) {
    const router = useRouter()

    const handleClick = useCallback(() => {
        // If onSelect is provided, use it (for future preview pane), otherwise navigate
        if (onSelect) {
            onSelect(contract.id)
        } else {
            router.push(`/contracts/${contract.id}`)
        }
    }, [router, contract.id, onSelect])

    const formattedDate = useMemo(() => formatLastUpdated(contract.last_updated), [contract.last_updated])

    const licensorDisplay = useMemo(() => {
        if (contract.licensors.length === 0) return "Unknown"
        return contract.licensors.join(", ")
    }, [contract.licensors])

    return (
        <tr
            onClick={handleClick}
            className="transition-[background-color] duration-75 hover:bg-[var(--nord3)] cursor-pointer group even:bg-white/5"
        >
            {/* ID - Monospace */}
            <td className="px-3 py-2.5 table-cell align-middle">
                <span className="font-mono text-xs text-[var(--text-dimmer)]">
                    {contract.id.slice(0, 8)}...
                </span>
            </td>

            {/* Licensor */}
            <td className="px-3 py-2.5 table-cell align-middle max-w-[250px]">
                <div className="text-[var(--text-bright)] font-semibold text-sm truncate" title={contract.licensors.join(", ")}>
                    {licensorDisplay}
                </div>
            </td>

            {/* Type */}
            <td className="px-3 py-2.5 text-[var(--text-dim)] text-xs table-cell align-middle">
                {contract.type}
            </td>

            {/* Status */}
            <td className="px-3 py-2.5 table-cell align-middle">
                <StatusBadge status={contract.status as any} />
            </td>

            {/* Pool % */}
            <td className="px-3 py-2.5 text-[var(--text-dim)] text-xs font-mono table-cell align-middle">
                {contract.pool_percent !== null ? `${contract.pool_percent}%` : "—"}
            </td>

            {/* Linked Releases */}
            <td className="px-3 py-2.5 text-[var(--text-dim)] text-xs table-cell align-middle pl-8">
                {contract.linked_releases_count}
            </td>

            {/* Last Updated */}
            <td className="px-3 py-2.5 text-[var(--text-dimmer)] text-xs table-cell align-middle text-right">
                {formattedDate}
            </td>
        </tr>
    )
})

ContractRowComponent.displayName = "ContractRow"

function ContractsTableComponent({ contracts, currentSort, onSortChange, onSelectContract }: ContractsTableProps) {
    return (
        <div className="overflow-x-auto bg-[var(--bg-main)]">
            <table className="w-full border-collapse text-left">
                <thead
                    className="border-t border-b bg-[var(--nord2)]"
                    style={{ borderColor: 'var(--border-primary)' }}
                >
                    <tr>
                        <th className="px-3 py-2 text-left w-24">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--text-dimmer)]">
                                ID
                            </span>
                        </th>
                        <th className="px-3 py-2 text-left">
                            <SortableHeader
                                column="licensors"
                                label="Licensor"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                        <th className="px-3 py-2 text-left w-32">
                            <SortableHeader
                                column="type"
                                label="Type"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                        <th className="px-3 py-2 text-left w-32">
                            <SortableHeader
                                column="status"
                                label="Status"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                        <th className="px-3 py-2 text-left w-24">
                            <SortableHeader
                                column="pool_percent"
                                label="Pool %"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                            />
                        </th>
                        <th className="px-3 py-2 text-left w-24">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--text-dimmer)]">
                                Releases
                            </span>
                        </th>
                        <th className="px-3 py-2 text-right w-32">
                            <SortableHeader
                                column="updated_at"
                                label="Updated"
                                currentSort={currentSort}
                                onSortChange={onSortChange}
                                className="justify-end"
                            />
                        </th>
                    </tr>
                </thead>
                <tbody className="border-separate border-spacing-0">
                    {contracts.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-3 py-12 text-center text-[var(--text-dimmer)]"
                            >
                                No contracts found
                            </td>
                        </tr>
                    ) : (
                        contracts.map((contract) => (
                            <ContractRowComponent
                                key={contract.id}
                                contract={contract}
                                onSelect={onSelectContract}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

export const ContractsTable = memo(ContractsTableComponent)

ContractsTable.displayName = "ContractsTable"

