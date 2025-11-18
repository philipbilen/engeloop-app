import { createServerClient } from "@/lib/supabase/server"
import { formatArtistDisplayLine } from "@/lib/utils/format-artists"
import { ClientReleasesTable } from "./_components/client-releases"
import type { ReleaseRow } from "./_components/releases-table"
import type { ReleaseStatus } from "@/components/ui/badge"

export default async function ReleasesPage() {
  const supabase = createServerClient()

  // Start building query
  const { data: releases } = await supabase
    .from("releases")
    .select(`
      id,
      title,
      version,
      release_date,
      type,
      upc,
      status,
      release_main_artists(
        position,
        artist_profiles(artist_name)
      )
    `)
    .order("release_date", { ascending: false, nullsLast: true })


  // Transform data for table
  const tableData: ReleaseRow[] =
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
    <ClientReleasesTable releases={tableData} />
  )
}
