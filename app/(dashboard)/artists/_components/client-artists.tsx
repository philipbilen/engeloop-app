"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { ArtistsTable, type ArtistRow, type ArtistSortOption, type ArtistSortColumn } from "./artists-table"
import { ArtistSummaryPanel, type ArtistDetail } from "./artist-summary-panel"
import type { SortDirection } from "@/components/ui/sortable-header"

interface ClientArtistsTableProps {
  artists: ArtistRow[]
  selectedArtistId?: string | null
  selectedDetail?: ArtistDetail | null
}

function sortArtists(data: ArtistRow[], sort: ArtistSortOption) {
  const [column, direction] = sort.split("_") as [ArtistSortColumn, SortDirection]
  const mod = direction === "asc" ? 1 : -1

  return [...data].sort((a, b) => {
    switch (column) {
      case "artist_name":
        return a.artist_name.localeCompare(b.artist_name) * mod
      case "spotify_url":
        return (a.spotify_url || "").localeCompare(b.spotify_url || "") * mod
      case "updated_at": {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
        return (dateA - dateB) * mod
      }
      default:
        return 0
    }
  })
}

export function ClientArtistsTable({ artists, selectedArtistId = null, selectedDetail = null }: ClientArtistsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [sort, setSort] = useState<ArtistSortOption>("artist_name_asc")
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedArtistId ?? null)
  const activeArtistId = selectedArtistId ?? localSelectedId

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return artists

    return artists.filter((artist) => {
      const haystack = `${artist.artist_name}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [artists, searchTerm])

  const sorted = useMemo(() => sortArtists(filtered, sort), [filtered, sort])

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const handleSortChange = useCallback((next: ArtistSortOption) => {
    setSort(next)
  }, [])

  const handleSelectArtist = useCallback((id: string) => {
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
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-bright)] font-sans">Artists</h1>
              <p className="text-sm text-[var(--text-dimmer)]">
                Manage artist profiles and DSP links
              </p>
            </div>
            <Button size="lg">
              + New Artist
            </Button>
          </div>

          {/* Controls */}
          <div className="space-y-4 pb-4">
            <div className="w-full md:max-w-md">
              <SearchBar 
                value={searchTerm} 
                onChange={handleSearchChange} 
                placeholder="Search artists..."
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-dimmer)]">
              <span className="font-mono">{sorted.length} results</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
          </div>

          {/* Table Section */}
          <div className="overflow-hidden">
            <ArtistsTable
              artists={sorted}
              currentSort={sort}
              onSortChange={handleSortChange}
              onSelectArtist={handleSelectArtist}
            />
          </div>
        </section>

        {/* Sidebar */}
        <aside className="col-span-12 xl:col-span-4 space-y-6">
          <ArtistSummaryPanel
            activeArtistId={activeArtistId}
            selectedDetail={selectedDetail}
            totalCount={artists.length}
          />
        </aside>
      </div>
    </div>
  )
}
