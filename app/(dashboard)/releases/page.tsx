import { createServerClient } from "@/lib/supabase/server"
import { formatArtistDisplayLine } from "@/lib/utils/format-artists"
import { ClientReleasesTable } from "./_components/client-releases"
import type { ReleaseRow } from "./_components/releases-table"
import type { ReleaseStatus } from "@/components/ui/badge"

interface ReleaseDetail {
  id: string
  title: string
  status: ReleaseStatus
  internal_catalog_id: string
  release_date: string | null
  type: string
  upc: string | null
  main_artists: string[]
  tracks: Array<{
    id: string
    title: string
    isrc: string | null
    contributors: Array<{ name: string; role: string; inherited?: boolean }>
    licensor_shares: Array<{ name: string; share_percent: number }>
  }>
  finance: {
    label_share_percent: number | null
    licensor_pool_percent: number | null
    term: string | null
  }
}

export default async function ReleasesPage({
  searchParams,
}: {
  searchParams?: Promise<{ selected?: string }>
}) {
  const supabase = createServerClient()
  const resolvedSearch = searchParams ? await searchParams : {}
  const selectedId = resolvedSearch?.selected || null

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
      internal_catalog_id,
      release_main_artists(
        position,
        artist_profiles(artist_name)
      )
    `)
    .order("release_date", { ascending: false, nullsLast: true })

  const tableData: ReleaseRow[] =
    releases?.map((release) => {
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

  let selectedDetail: ReleaseDetail | null = null

  if (selectedId) {
    const { data: releaseDetail } = await supabase
      .from("releases")
      .select(`
        id,
        title,
        status,
        internal_catalog_id,
        release_date,
        type,
        upc,
        release_main_artists(
          position,
          artist_profiles(artist_name)
        ),
        tracks(
          id,
          title,
          isrc,
          track_contributors(
            role,
            role_custom,
            inherited_from_release,
            artist_profiles(artist_name)
          ),
          licensor_shares:licensor_shares(
            share_percent,
            role_context,
            role_context_custom,
            contacts:contacts(full_legal_name)
          )
        ),
        contract_releases(
          contracts(
            id,
            status,
            label_share_percent,
            licensor_pool_percent,
            term_type,
            term_value_years,
            auto_renew_interval_years,
            notice_period_days
          )
        )
      `)
      .eq("id", selectedId)
      .single()

    if (releaseDetail) {
      const mainArtists =
        releaseDetail.release_main_artists
          ?.sort((a, b) => a.position - b.position)
          .map((link) => link.artist_profiles?.artist_name)
          .filter(Boolean) || []

      const schedule = releaseDetail.contract_releases?.[0]?.contracts

      const term = schedule
        ? buildTermDisplay({
            term_type: schedule.term_type,
            term_value_years: schedule.term_value_years,
            auto_renew_interval_years: schedule.auto_renew_interval_years,
          })
        : null

      selectedDetail = {
        id: releaseDetail.id,
        title: releaseDetail.title,
        status: releaseDetail.status as ReleaseStatus,
        internal_catalog_id: releaseDetail.internal_catalog_id,
        release_date: releaseDetail.release_date,
        type: releaseDetail.type,
        upc: releaseDetail.upc,
        main_artists: mainArtists,
        tracks:
          releaseDetail.tracks?.map((track) => ({
            id: track.id,
            title: track.title,
            isrc: track.isrc,
            contributors:
              track.track_contributors?.map((contrib) => ({
                name: contrib.artist_profiles?.artist_name || "Unknown",
                role: contrib.role,
                inherited: contrib.inherited_from_release,
              })) || [],
            licensor_shares:
              track.licensor_shares?.map((share) => ({
                name: share.contacts?.full_legal_name || "Unknown",
                share_percent: share.share_percent,
              })) || [],
          })) || [],
        finance: {
          label_share_percent: schedule?.label_share_percent ?? null,
          licensor_pool_percent: schedule?.licensor_pool_percent ?? null,
          term,
        },
      }
    }
  }

  return (
    <ClientReleasesTable
      releases={tableData}
      selectedReleaseId={selectedId}
      selectedDetail={selectedDetail}
    />
  )
}

function buildTermDisplay({
  term_type,
  term_value_years,
  auto_renew_interval_years,
}: {
  term_type: string | null
  term_value_years: number | null
  auto_renew_interval_years: number | null
}) {
  switch (term_type) {
    case "perpetual":
      return "Perpetual"
    case "fixed":
      return term_value_years ? `${term_value_years} Years` : "Fixed term"
    case "auto_renew":
      return auto_renew_interval_years
        ? `Auto-renews every ${auto_renew_interval_years} yrs`
        : "Auto-renew"
    case "evergreen_with_notice":
      return "Evergreen (notice required)"
    default:
      return null
  }
}
