"use client"

import { useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { SearchBar } from "./search-bar"
import { ContractStatusFilters } from "./contract-status-filters"
import { ContractsTable, type ContractRow, type ContractStatus } from "./contracts-table"
import type { SortOption, SortColumn, SortDirection } from "./sortable-header"

interface ClientContractsTableProps {
    contracts: ContractRow[]
}

function sortContracts(data: ContractRow[], sort: SortOption) {
    const [column, direction] = sort.split("_") as [SortColumn, SortDirection]
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

export function ClientContractsTable({ contracts }: ClientContractsTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [status, setStatus] = useState<"all" | ContractStatus>("all")
    const [sort, setSort] = useState<SortOption>("updated_at_desc")

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

    const sortLabel = useMemo(() => {
        const [column, direction] = sort.split("_") as [SortColumn, SortDirection]
        const label = column === "updated_at" ? "Updated"
            : column === "licensors" ? "Licensor"
                : column === "type" ? "Type"
                    : column === "status" ? "Status"
                        : "Pool %"
        return `${label} ${direction === "asc" ? "↑" : "↓"}`
    }, [sort])

    const handleSearchChange = useCallback((term: string) => {
        setSearchTerm(term)
    }, [])

    const handleStatusChange = useCallback((next: "all" | ContractStatus) => {
        setStatus(next)
    }, [])

    const handleSortChange = useCallback((next: SortOption) => {
        setSort(next)
    }, [])

    return (
        <div className="min-h-screen space-y-6">
            <div className="grid grid-cols-12 gap-6">
                <section className="col-span-12 space-y-6">
                    <Card padding="lg" className="space-y-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dimmer)]">Dashboard</p>
                                <h1 className="text-2xl font-semibold text-[var(--text-bright)]">Contracts</h1>
                                <p className="text-sm text-[var(--text-dimmer)]">
                                    {sorted.length} shown · {contracts.length} total
                                </p>
                            </div>
                            <Button className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white shadow-lg shadow-indigo-500/20">
                                <Plus className="w-4 h-4 mr-2" />
                                New Contract
                            </Button>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-3 lg:items-center">
                            <div className="lg:col-span-2">
                                <SearchBar
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Search by licensor, type, or ID..."
                                />
                            </div>
                            <div className="flex justify-end text-xs text-[var(--text-dimmer)]">
                                Sorted by: <span className="ml-1 font-semibold text-[var(--text-bright)] uppercase">{sortLabel}</span>
                            </div>
                        </div>

                        <ContractStatusFilters value={status} onChange={handleStatusChange} />
                    </Card>

                    <Card padding="lg" className="space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="flex gap-3">
                                <div className="rounded-md bg-[var(--bg-interactive)] px-3 py-2 text-xs uppercase tracking-wide text-[var(--text-dim)]">
                                    Table view
                                </div>
                            </div>
                        </div>
                        <ContractsTable
                            contracts={sorted}
                            currentSort={sort}
                            onSortChange={handleSortChange}
                        />
                    </Card>
                </section>
            </div>
        </div>
    )
}
