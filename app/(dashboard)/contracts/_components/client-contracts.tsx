"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { ContractStatusFilters } from "./contract-status-filters"
import { ContractsTable, type ContractRow, type ContractStatus, type ContractSortOption, type ContractSortColumn } from "./contracts-table"
import { ContractSummaryPanel, type ContractDetail } from "./contract-summary-panel"
import type { SortDirection } from "@/components/ui/sortable-header"

interface ClientContractsTableProps {
    contracts: ContractRow[]
    selectedContractId?: string | null
    selectedDetail?: ContractDetail | null
}

function sortContracts(data: ContractRow[], sort: ContractSortOption) {
    const [column, direction] = sort.split("_") as [ContractSortColumn, SortDirection]
    const mod = direction === "asc" ? 1 : -1

    return [...data].sort((a, b) => {
        switch (column) {
            case "updated_at": {
                const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0
                const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0
                return (dateA - dateB) * mod
            }
            case "licensors":
                return (a.licensors[0] || "").localeCompare(b.licensors[0] || "") * mod
            case "type":
                return a.type.localeCompare(b.type) * mod
            case "status":
                return a.status.localeCompare(b.status) * mod
            case "pool_percent":
                return ((a.pool_percent || 0) - (b.pool_percent || 0)) * mod
            default:
                return 0
        }
    })
}

export function ClientContractsTable({ contracts, selectedContractId = null, selectedDetail = null }: ClientContractsTableProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [searchTerm, setSearchTerm] = useState("")
    const [status, setStatus] = useState<"all" | ContractStatus>("all")
    const [sort, setSort] = useState<ContractSortOption>("updated_at_desc")
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedContractId ?? null)
    const activeContractId = selectedContractId ?? localSelectedId

    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()

        return contracts.filter((contract) => {
            if (status !== "all" && contract.status !== status) return false
            if (!term) return true

            const haystack = `${contract.licensors.join(" ")} ${contract.type} ${contract.id}`.toLowerCase()
            return haystack.includes(term)
        })
    }, [contracts, searchTerm, status])

    const sorted = useMemo(() => sortContracts(filtered, sort), [filtered, sort])

    const handleSearchChange = useCallback((term: string) => {
        setSearchTerm(term)
    }, [])

    const handleStatusChange = useCallback((next: "all" | ContractStatus) => {
        setStatus(next)
    }, [])

    const handleSortChange = useCallback((next: ContractSortOption) => {
        setSort(next)
    }, [])

    const handleSelectContract = useCallback((id: string) => {
        setLocalSelectedId(id)
        const params = new URLSearchParams(searchParams?.toString() || "")
        params.set("selected", id)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [pathname, router, searchParams])

    return (
        <div className="min-h-screen space-y-8">
            <div className="grid grid-cols-12 gap-8">
                <section className="col-span-12 xl:col-span-8 space-y-6">
                    {/* Page Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-bright)] font-sans">Contracts</h1>
                            <p className="text-sm text-[var(--text-dimmer)]">
                                Manage agreements, splits, and release schedules
                            </p>
                        </div>
                        <Button size="lg">
                            + New Contract
                        </Button>
                    </div>

                    {/* Controls */}
                    <div className="space-y-4 pb-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="w-full md:max-w-md">
                                <SearchBar
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Search by licensor, type, or ID..."
                                />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-dimmer)]">
                                <span className="font-mono">{sorted.length} results</span>
                            </div>
                        </div>
                        <div className="pt-1">
                            <ContractStatusFilters value={status} onChange={handleStatusChange} />
                        </div>
                        <div className="h-px bg-[var(--border-primary)]" />
                    </div>

                    {/* Table Section */}
                    <div className="overflow-hidden">
                        <ContractsTable
                            contracts={sorted}
                            currentSort={sort}
                            onSortChange={handleSortChange}
                            onSelectContract={handleSelectContract}
                        />
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="col-span-12 xl:col-span-4 space-y-6">
                    <ContractSummaryPanel
                        activeContractId={activeContractId}
                        selectedDetail={selectedDetail}
                        totalCount={contracts.length}
                    />
                </aside>
            </div>
        </div>
    )
}
