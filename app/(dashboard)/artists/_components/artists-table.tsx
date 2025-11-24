"use client"

import { memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SortableHeader, type SortOption } from "@/components/ui/sortable-header"
import { cn } from "@/lib/utils"

export type ArtistSortColumn = "artist_name" | "spotify_url" | "updated_at"
export type ArtistSortOption = SortOption<ArtistSortColumn>

export interface ArtistRow {
  id: string
  artist_name: string
  spotify_url: string | null
  updated_at: string | null
}

interface ArtistsTableProps {
  artists: ArtistRow[]
  currentSort: ArtistSortOption
  onSortChange: (next: ArtistSortOption) => void
  onSelectArtist?: (id: string) => void
}

function formatLastUpdated(dateString: string | null) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const ArtistRowComponent = memo(function ArtistRow({
  artist,
  onSelect,
}: {
  artist: ArtistRow
  onSelect?: (id: string) => void
}) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(artist.id)
    } else {
      router.push(`/artists/${artist.id}`)
    }
  }, [router, artist.id, onSelect])

  const formattedDate = useMemo(() => formatLastUpdated(artist.updated_at), [artist.updated_at])

  return (
    <tr
      onClick={handleClick}
      className="transition-[background-color] duration-75 hover:bg-[var(--nord3)] cursor-pointer group even:bg-white/5"
    >
      {/* Artist Name */}
      <td className="px-3 py-2.5 table-cell align-middle">
        <div className="text-[var(--text-bright)] font-semibold text-sm truncate max-w-[250px]" title={artist.artist_name}>
          {artist.artist_name}
        </div>
      </td>

      {/* Spotify URL */}
      <td className="px-3 py-2.5 table-cell align-middle">
        <div className="text-[var(--text-dim)] text-xs truncate max-w-[250px]" title={artist.spotify_url || ""}>
          {artist.spotify_url || "—"}
        </div>
      </td>

      {/* Updated */}
      <td className="px-3 py-2.5 text-[var(--text-dimmer)] text-xs table-cell align-middle text-right">
        {formattedDate}
      </td>
    </tr>
  )
})

ArtistRowComponent.displayName = "ArtistRow"

function ArtistsTableComponent({ artists, currentSort, onSortChange, onSelectArtist }: ArtistsTableProps) {
  return (
    <div className="overflow-x-auto bg-[var(--bg-main)]">
      <table className="w-full border-collapse text-left">
        <thead
          className="border-t border-b bg-[var(--nord2)]"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <tr>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                column="artist_name"
                label="Artist Name"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2 text-left w-64">
              <SortableHeader
                column="spotify_url"
                label="Spotify URL"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
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
          {artists.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="px-3 py-12 text-center text-[var(--text-dimmer)]"
              >
                No artists found
              </td>
            </tr>
          ) : (
            artists.map((artist) => (
              <ArtistRowComponent
                key={artist.id}
                artist={artist}
                onSelect={onSelectArtist}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export const ArtistsTable = memo(ArtistsTableComponent)

ArtistsTable.displayName = "ArtistsTable"
