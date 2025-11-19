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
    router.replace(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  return (
    <div className="min-h-screen space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 xl:col-span-8 space-y-6">
          <Card padding="lg" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dimmer)]">Dashboard</p>
                <h1 className="text-2xl font-semibold text-[var(--text-bright)]">Releases</h1>
                <p className="text-sm text-[var(--text-dimmer)]">
                  {sorted.length} shown · {releases.length} total
                </p>
              </div>
              <Link href="/releases/new" className="self-start md:self-auto">
                <Button size="lg">+ New Release</Button>
              </Link>
            </div>

            <div className="grid gap-3 lg:grid-cols-3 lg:items-center">
              <div className="lg:col-span-2">
                <SearchBar value={searchTerm} onChange={handleSearchChange} />
              </div>
              <div className="flex justify-end text-xs text-[var(--text-dimmer)]">
                Sorted by: <span className="ml-1 font-semibold text-[var(--text-bright)] uppercase">{sortLabel}</span>
              </div>
            </div>

            <StatusFilters value={status} onChange={handleStatusChange} />
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <div className="rounded-md bg-[var(--bg-interactive)] px-3 py-2 text-xs uppercase tracking-wide text-[var(--text-dim)]">
                  Table view
                </div>
                <div className="rounded-md bg-[color:rgba(var(--accent-primary-rgb),0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                  Click rows to preview
                </div>
              </div>
              <div className="text-sm text-[var(--text-dimmer)]">
                Click a row to lock the right summary panel
              </div>
            </div>
            <ReleasesTable
              releases={sorted}
              currentSort={sort}
              onSortChange={handleSortChange}
              onSelectRelease={handleSelectRelease}
            />
          </Card>
        </section>

        <aside className="col-span-12 xl:col-span-4 space-y-4">
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
