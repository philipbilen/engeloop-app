"use client"

import { memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/ui/badge"
import { SortableHeader, type SortOption } from "@/components/ui/sortable-header"
import type { ReleaseStatus } from "@/components/ui/badge"

export type ReleaseSortColumn = "release_date" | "title" | "status"
export type ReleaseSortOption = SortOption<ReleaseSortColumn>

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
  currentSort: ReleaseSortOption
  onSortChange: (next: ReleaseSortOption) => void
  onSelectRelease?: (id: string) => void
}

function formatReleaseDate(dateString: string | null) {
  if (!dateString) return "—"

  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const ReleaseRowComponent = memo(function ReleaseRow({
  release,
  onSelect,
}: {
  release: ReleaseRow
  onSelect?: (id: string) => void
}) {
  const router = useRouter()
  const formattedDate = useMemo(() => formatReleaseDate(release.release_date), [release.release_date])

  const handleClick = useCallback(() => {
    onSelect?.(release.id)
  }, [onSelect, release.id])

  const handleDoubleClick = useCallback(() => {
    router.push(`/releases/${release.id}/edit`)
  }, [router, release.id])

  return (
    <tr
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="transition-[background-color] duration-75 hover:bg-[var(--nord3)] cursor-pointer group even:bg-white/5"
    >
      {/* Release Date */}
      <td className="px-3 py-2.5 table-cell align-middle">
        <div className="text-[var(--text-bright)] font-mono text-xs">
          {formattedDate}
        </div>
      </td>

      {/* Title / Artist - Stacked */}
      <td className="px-3 py-2.5 table-cell align-middle">
        <div className="text-[var(--text-bright)] font-semibold text-sm font-sans">
          {release.title}
          {release.version && (
            <span className="text-[var(--text-dim)] font-normal">
              {" "}({release.version})
            </span>
          )}
        </div>
        <div className="text-[var(--text-dim)] text-xs mt-0.5">
          {release.artist_display}
        </div>
      </td>

      {/* Type */}
      <td className="px-3 py-2.5 text-[var(--text-dim)] text-xs table-cell align-middle uppercase">
        {release.type}
      </td>

      {/* UPC */}
      <td className="px-3 py-2.5 text-[var(--text-dim)] text-[11px] font-mono table-cell align-middle">
        {release.upc || "—"}
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 table-cell align-middle">
        <StatusBadge status={release.status} />
      </td>
    </tr>
  )
})

ReleaseRowComponent.displayName = "ReleaseRow"

function ReleasesTableComponent({ releases, currentSort, onSortChange, onSelectRelease }: ReleasesTableProps) {
  return (
    <div className="overflow-x-auto bg-[var(--bg-main)]">
      <table className="w-full border-collapse text-left">
        <thead
          className="border-t border-b bg-[var(--nord2)]"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <tr>
            <th className="px-3 py-2 text-left w-28">
              <SortableHeader
                column="release_date"
                label="Date"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                column="title"
                label="Title / Artist"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2 text-left w-20">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--text-dimmer)]">
                Type
              </span>
            </th>
            <th className="px-3 py-2 text-left w-32">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--text-dimmer)]">
                UPC
              </span>
            </th>
            <th className="px-3 py-2 text-left w-32">
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
                className="px-3 py-12 text-center text-[var(--text-dimmer)]"
              >
                No releases found
              </td>
            </tr>
          ) : (
            releases.map((release) => (
              <ReleaseRowComponent
                key={release.id}
                release={release}
                onSelect={onSelectRelease}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export const ReleasesTable = memo(ReleasesTableComponent)

ReleasesTable.displayName = "ReleasesTable"
