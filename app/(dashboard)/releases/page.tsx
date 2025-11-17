import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SearchBar } from "./_components/search-bar"
import { StatusFilters } from "./_components/status-filters"
import { ReleasesTable } from "./_components/releases-table"
import { formatArtistDisplayLine } from "@/lib/utils/format-artists"
import type { ReleaseStatus } from "@/components/ui/badge"
import type { SortOption } from "./_components/sortable-header"

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    sort?: string
  }>
}

export default async function ReleasesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = createServerClient()

  // Start building query
  let query = supabase
    .from("releases")
    .select(`
      id,
      title,
      version,
      release_date,
      type,
      upc,
      status,
      internal_catalog_id,
      release_main_artists(
        position,
        artist_profiles(artist_name)
      )
    `)

  // Apply search filter via RPC
  if (params.q) {
    const { data: matchingIds } = await supabase.rpc("search_releases", {
      query_text: params.q,
    })

    if (matchingIds && matchingIds.length > 0) {
      const ids = matchingIds.map((r) => r.release_id)
      query = query.in("id", ids)
    } else {
      // No matches - return empty result
      query = query.eq("id", "00000000-0000-0000-0000-000000000000") // Non-existent ID
    }
  }

  // Apply status filter
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  // Apply sorting
  const sortBy = (params.sort || "release_date_desc") as SortOption
  const [column, direction] = sortBy.split("_") as [string, "asc" | "desc"]

  switch (column) {
    case "release_date":
      query = query.order("release_date", {
        ascending: direction === "asc",
        nullsLast: true,
      })
      break
    case "title":
      query = query.order("title", { ascending: direction === "asc" })
      break
    case "status":
      query = query.order("status", { ascending: direction === "asc" })
      break
  }

  const { data: releases, error } = await query

  // Log any errors for debugging
  if (error) {
    console.error("Error fetching releases:", error)
  }

  console.log("Releases query result:", { count: releases?.length, releases })

  // Transform data for table
  const tableData =
    releases?.map((release) => {
      // Extract and sort artists by position
      const artists =
        release.release_main_artists
          ?.sort((a, b) => a.position - b.position)
          .map((link) => link.artist_profiles)
          .filter(Boolean) || []

      return {
        id: release.id,
        title: release.title,
        version: release.version,
        release_date: release.release_date,
        type: release.type,
        upc: release.upc,
        status: release.status as ReleaseStatus,
        artist_display: formatArtistDisplayLine(artists),
      }
    }) || []

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
              {tableData.length} total release{tableData.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/releases/new">
            <Button>+ NEW RELEASE</Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <SearchBar />
          <StatusFilters />
        </div>
      </div>

      {/* Table */}
      <div className="p-8">
        <ReleasesTable releases={tableData} />
      </div>
    </div>
  )
}
