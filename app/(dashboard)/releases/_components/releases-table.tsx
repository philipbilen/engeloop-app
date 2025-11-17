"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/ui/badge"
import { SortableHeader } from "./sortable-header"
import type { ReleaseStatus } from "@/components/ui/badge"

interface Artist {
  stage_name: string
}

interface ReleaseRow {
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

export function ReleasesTable({ releases }: ReleasesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead
          className="border-b-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <tr>
            <th className="px-4 py-3 text-left w-32">
              <SortableHeader column="release_date" label="Release Date" />
            </th>
            <th className="px-4 py-3 text-left">
              <SortableHeader column="title" label="Title / Artist" />
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
              <SortableHeader column="status" label="Status" />
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
            releases.map((release) => {
              const date = formatReleaseDate(release.release_date)

              return (
                <Link
                  key={release.id}
                  href={`/releases/${release.id}/edit`}
                  legacyBehavior
                >
                  <a
                    className="table-row border-b transition-colors hover:bg-[var(--bg-interactive)] cursor-pointer group"
                    style={{ borderColor: "var(--border-primary)" }}
                  >
                    {/* Release Date - Stacked */}
                    <td className="px-4 py-4 table-cell align-middle">
                      <div className="text-[var(--text-bright)] font-medium text-sm">
                        {date.line1}
                      </div>
                      {date.line2 && (
                        <div className="text-[var(--text-dimmer)] text-xs">
                          {date.line2}
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
                  </a>
                </Link>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
