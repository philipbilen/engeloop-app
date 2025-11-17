import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ReleaseDetailLayout } from "@/components/releases/release-detail-layout"
import { getAllContacts } from "@/lib/actions/agreements"
import { getContributorsByRelease } from "@/lib/actions/contributors"
import { getAllArtistProfiles } from "@/lib/actions/artists"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReleaseEditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServerClient()

  // Parallelize data fetching
  const [
    releaseResult,
    allSchedulesResult,
    linkedSchedulesResult,
    allContactsResult,
    contributorsResult,
    allArtistsResult,
  ] = await Promise.all([
    supabase.from("releases").select(`*, tracks(*)`).eq("id", id).single(),
    supabase.from("contracts").select("*").order("created_at", { ascending: false }),
    supabase.from("contract_releases").select(`contracts(*)`).eq("release_id", id),
    getAllContacts(),
    getContributorsByRelease(id),
    getAllArtistProfiles(),
  ])

  const { data: release, error: releaseError } = releaseResult
  if (releaseError || !release) {
    notFound()
  }

  const { data: allSchedules } = allSchedulesResult
  const linkedSchedules = linkedSchedulesResult.data?.map(item => item.contracts).filter(Boolean) || []
  const allContacts = allContactsResult || []
  const contributors = contributorsResult || []
  const allArtists = allArtistsResult || []

  // Fetch main artists separately with the correct join
  const { data: artistLinks } = await supabase
    .from("release_main_artists")
    .select(`
      position,
      artist_profiles(*)
    `)
    .eq("release_id", id)
    .order("position")

  const mainArtists = artistLinks?.map(link => link.artist_profiles).filter(Boolean) || []

  return (
    <ReleaseDetailLayout
      release={release}
      mainArtists={mainArtists}
      linkedSchedules={linkedSchedules}
      allSchedules={allSchedules || []}
      allContacts={allContacts}
      contributors={contributors}
      allArtists={allArtists}
    />
  )
}
