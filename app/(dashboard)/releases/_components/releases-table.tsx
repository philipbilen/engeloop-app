"use client"

import { memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/ui/badge"
import { SortableHeader, type SortOption } from "./sortable-header"
import type { ReleaseStatus } from "@/components/ui/badge"

interface Artist {
  stage_name: string
}

export interface ReleaseRow {
  id: string
  title: string
  version: string | null
  release_date: string | null
  type: string
  upc: string | null
  status: ReleaseStatus
  artist_display: string
}

interface ReleasesTableProps {
  releases: ReleaseRow[]
  currentSort: SortOption
  onSortChange: (next: SortOption) => void
}

function formatReleaseDate(dateString: string | null) {
  if (!dateString) return { line1: "—", line2: "" }

  const date = new Date(dateString)
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const day = date.getDate().toString().padStart(2, "0")
  const year = date.getFullYear()

  return {
    line1: `${month} ${day}`,
    line2: year.toString(),
  }
}

const ReleaseRowComponent = memo(function ReleaseRow({ release }: { release: ReleaseRow }) {
  const router = useRouter()

  const formattedDate = useMemo(() => formatReleaseDate(release.release_date), [release.release_date])

  const handleClick = useCallback(() => {
    router.push(`/releases/${release.id}/edit`)
  }, [release.id, router])

  return (
    <tr
      onClick={handleClick}
      className="border-b transition-colors hover:bg-[var(--bg-interactive)] cursor-pointer group"
      style={{ borderColor: "var(--border-primary)" }}
    >
      {/* Release Date - Stacked */}
      <td className="px-4 py-4 table-cell align-middle">
        <div className="text-[var(--text-bright)] font-medium text-sm">
          {formattedDate.line1}
        </div>
        {formattedDate.line2 && (
          <div className="text-[var(--text-dimmer)] text-xs">
            {formattedDate.line2}
          </div>
        )}
      </td>

      {/* Title / Artist - Stacked */}
      <td className="px-4 py-4 table-cell align-middle">
        <div className="text-[var(--text-bright)] font-semibold">
          {release.title}
          {release.version && (
            <span className="text-[var(--text-dim)] font-normal">
              {" "}({release.version})
            </span>
          )}
        </div>
        <div className="text-[var(--text-dim)] text-sm mt-1">
          {release.artist_display}
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-4 text-[var(--text-dim)] text-sm table-cell align-middle">
        {release.type}
      </td>

      {/* UPC */}
      <td className="px-4 py-4 text-[var(--text-dim)] text-sm font-mono table-cell align-middle">
        {release.upc || "—"}
      </td>

      {/* Status */}
      <td className="px-4 py-4 table-cell align-middle">
        <StatusBadge status={release.status} />
      </td>
    </tr>
  )
})

ReleaseRowComponent.displayName = "ReleaseRow"

function ReleasesTableComponent({ releases, currentSort, onSortChange }: ReleasesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead
          className="border-b-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <tr>
            <th className="px-4 py-3 text-left w-32">
              <SortableHeader
                column="release_date"
                label="Release Date"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-4 py-3 text-left">
              <SortableHeader
                column="title"
                label="Title / Artist"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-4 py-3 text-left w-24">
              <span className="font-semibold uppercase tracking-wide text-xs text-[var(--text-dimmer)]">
                Type
              </span>
            </th>
            <th className="px-4 py-3 text-left w-40">
              <span className="font-semibold uppercase tracking-wide text-xs text-[var(--text-dimmer)]">
                UPC
              </span>
            </th>
            <th className="px-4 py-3 text-left w-44">
              <SortableHeader
                column="status"
                label="Status"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
          </tr>
        </thead>
        <tbody className="border-separate border-spacing-0">
          {releases.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-12 text-center text-[var(--text-dimmer)]"
              >
                No releases found
              </td>
            </tr>
          ) : (
            releases.map((release) => (
              <ReleaseRowComponent key={release.id} release={release} />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export const ReleasesTable = memo(ReleasesTableComponent)

ReleasesTable.displayName = "ReleasesTable"
