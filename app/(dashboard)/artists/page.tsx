import { createServerClient } from "@/lib/supabase/server"
import { ClientArtistsTable } from "./_components/client-artists"
import type { ArtistRow } from "./_components/artists-table"
import type { ArtistDetail } from "./_components/artist-summary-panel"

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams?: Promise<{ selected?: string }>
}) {
  const supabase = createServerClient()
  const resolvedSearch = searchParams ? await searchParams : {}
  const selectedId = resolvedSearch?.selected || null

  const { data: artists } = await supabase
    .from("artist_profiles")
    .select("id, artist_name, spotify_url, updated_at")
    .order("artist_name", { ascending: true })

  const tableData: ArtistRow[] = artists || []

  let selectedDetail: ArtistDetail | null = null

  if (selectedId) {
    const { data: artist } = await supabase
      .from("artist_profiles")
      .select("*")
      .eq("id", selectedId)
      .single()
    
    if (artist) {
      selectedDetail = {
        id: artist.id,
        artist_name: artist.artist_name,
        spotify_url: artist.spotify_url,
        apple_music_url: artist.apple_music_url,
        updated_at: artist.updated_at,
      }
    }
  }

  return (
    <ClientArtistsTable 
      artists={tableData} 
      selectedArtistId={selectedId}
      selectedDetail={selectedDetail}
    />
  )
}
