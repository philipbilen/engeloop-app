"use client"

import { useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SearchBar } from "./search-bar"
import { StatusFilters } from "./status-filters"
import { ReleasesTable, type ReleaseRow } from "./releases-table"
import { SummaryPanel } from "./summary-panel"
import type { ReleaseDetail } from "./release-summary-detail"
import type { ReleaseStatus } from "@/components/ui/badge"
import type { SortOption, SortColumn, SortDirection } from "./sortable-header"

interface ClientReleasesTableProps {
  releases: ReleaseRow[]
  selectedReleaseId?: string | null
  selectedDetail?: ReleaseDetail | null
}

function sortReleases(data: ReleaseRow[], sort: SortOption) {
  const [column, direction] = sort.split("_") as [SortColumn, SortDirection]
  const mod = direction === "asc" ? 1 : -1

  return [...data].sort((a, b) => {
    switch (column) {
      case "release_date": {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0
        return (dateA - dateB) * mod
      }
      case "title":
        return a.title.localeCompare(b.title) * mod
      case "status":
        return a.status.localeCompare(b.status) * mod
      default:
        return 0
    }
  })
}

export function ClientReleasesTable({ releases, selectedReleaseId = null, selectedDetail = null }: ClientReleasesTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [status, setStatus] = useState<"all" | ReleaseStatus>("all")
  const [sort, setSort] = useState<SortOption>("release_date_desc")
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedReleaseId ?? null)
  const activeReleaseId = selectedReleaseId ?? localSelectedId

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return releases.filter((release) => {
      if (status !== "all" && release.status !== status) return false
      if (!term) return true

      const haystack = `${release.title} ${release.artist_display} ${release.upc ?? ""}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [releases, searchTerm, status])

  const sorted = useMemo(() => sortReleases(filtered, sort), [filtered, sort])
  const sortLabel = useMemo(() => {
    const [column, direction] = sort.split("_") as [SortColumn, SortDirection]
    const label = column === "release_date" ? "Release Date" : column === "title" ? "Title" : "Status"
    return `${label} ${direction === "asc" ? "↑" : "↓"}`
  }, [sort])

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const handleStatusChange = useCallback((next: "all" | ReleaseStatus) => {
    setStatus(next)
  }, [])

  const handleSortChange = useCallback((next: SortOption) => {
    setSort(next)
  }, [])
  const statusCounts = useMemo(() => {
    return releases.reduce<Record<ReleaseStatus, number>>((acc, release) => {
      acc[release.status] = (acc[release.status] || 0) + 1
      return acc
    }, {
      planning: 0,
      signed: 0,
      in_progress: 0,
      ready_for_delivery: 0,
      delivered: 0,
      released: 0,
      archived: 0,
    })
  }, [releases])

  const handleSelectRelease = useCallback((id: string) => {
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
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-bright)]">Releases</h1>
              <p className="text-sm text-[var(--text-dimmer)]">
                Manage your catalog releases and schedules
              </p>
            </div>
            <Link href="/releases/new">
              <Button size="lg" className="shadow-sm hover:shadow-md transition-all">
                + New Release
              </Button>
            </Link>
          </div>

          {/* Controls & Filters */}
          <div className="space-y-4 pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:max-w-md">
                <SearchBar value={searchTerm} onChange={handleSearchChange} />
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-dimmer)]">
                <span className="font-mono">{sorted.length} results</span>
                <span className="h-3 w-px bg-[var(--border-primary)]" />
                <span>Sorted by:</span>
                <button
                  onClick={() => {
                    // Cycle sort: date_desc -> date_asc -> title_asc -> title_desc -> status_asc -> status_desc
                    // Simple toggle for now or just keep label
                    const next: SortOption = sort === "release_date_desc" ? "release_date_asc" : "release_date_desc"
                    handleSortChange(next)
                  }}
                  className="font-bold text-[var(--text-bright)] uppercase hover:text-[var(--frost-cyan)] transition-colors text-[10px] tracking-wider"
                >
                  {sortLabel}
                </button>
              </div>
            </div>
            <div className="pt-1">
              <StatusFilters value={status} onChange={handleStatusChange} />
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
          </div>

          {/* Table Section */}
          <div className="overflow-hidden">
            <ReleasesTable
              releases={sorted}
              currentSort={sort}
              onSortChange={handleSortChange}
              onSelectRelease={handleSelectRelease}
            />
          </div>
        </section>

        <aside className="col-span-12 xl:col-span-4 space-y-6 pt-[88px]">
          <SummaryPanel
            activeReleaseId={activeReleaseId}
            selectedDetail={selectedDetail}
            statusCounts={statusCounts}
            totalCount={releases.length}
          />
        </aside>
      </div>
    </div>
  )
}
