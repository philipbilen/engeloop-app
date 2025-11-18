"use client"

import { useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchBar } from "./search-bar"
import { StatusFilters } from "./status-filters"
import { ReleasesTable, type ReleaseRow } from "./releases-table"
import type { ReleaseStatus } from "@/components/ui/badge"
import type { SortOption, SortColumn, SortDirection } from "./sortable-header"

interface ClientReleasesTableProps {
  releases: ReleaseRow[]
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

export function ClientReleasesTable({ releases }: ClientReleasesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [status, setStatus] = useState<"all" | ReleaseStatus>("all")
  const [sort, setSort] = useState<SortOption>("release_date_desc")

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

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const handleStatusChange = useCallback((next: "all" | ReleaseStatus) => {
    setStatus(next)
  }, [])

  const handleSortChange = useCallback((next: SortOption) => {
    setSort(next)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-deep-dark)" }}>
      {/* Header */}
      <div
        className="border-b-2 p-8"
        style={{
          backgroundColor: "var(--bg-main)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-bright)" }}
            >
              RELEASES
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
              {sorted.length} release{sorted.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/releases/new">
            <Button>+ NEW RELEASE</Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <SearchBar value={searchTerm} onChange={handleSearchChange} />
          <StatusFilters value={status} onChange={handleStatusChange} />
        </div>
      </div>

      {/* Table */}
      <div className="p-8">
        <ReleasesTable releases={sorted} currentSort={sort} onSortChange={handleSortChange} />
      </div>
    </div>
  )
}
