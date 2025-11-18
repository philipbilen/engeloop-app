"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/lib/supabase/types"

type CreditRole = Database["public"]["Enums"]["credit_role"]

export async function fanOutTrackMainArtists(releaseId: string, artistIds: string[]) {
  if (artistIds.length === 0) return { success: true }

  const supabase = createServerClient()

  // Fetch tracks for the release
  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id")
    .eq("release_id", releaseId)
    .order("position")

  if (tracksError) throw tracksError
  if (!tracks || tracks.length === 0) return { success: true }

  // Build rows for missing artists per track
  for (const track of tracks) {
    const { data: existing } = await supabase
      .from("track_main_artists")
      .select("artist_profile_id, position")
      .eq("track_id", track.id)
      .order("position")

    const maxPosition = existing?.reduce((max, row) => Math.max(max, row.position ?? -1), -1) ?? -1
    const existingIds = new Set(existing?.map((row) => row.artist_profile_id) || [])

    const missing = artistIds.filter((id) => !existingIds.has(id))
    if (missing.length === 0) continue

    const rows = missing.map((artistId, idx) => ({
      track_id: track.id,
      artist_profile_id: artistId,
      position: maxPosition + idx + 1,
      inherited_from_release: true,
    }))

    const { error } = await supabase
      .from("track_main_artists")
      .upsert(rows, { onConflict: "track_id,artist_profile_id", ignoreDuplicates: true })

    if (error) throw error
  }

  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}

export async function addTrackMainArtist(trackId: string, artistProfileId: string, releaseId: string) {
  const supabase = createServerClient()
  // Determine next position
  const { data: existing } = await supabase
    .from("track_main_artists")
    .select("position")
    .eq("track_id", trackId)
    .order("position", { ascending: false })
    .limit(1)

  const nextPos = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0

  const { error } = await supabase
    .from("track_main_artists")
    .upsert(
      {
        track_id: trackId,
        artist_profile_id: artistProfileId,
        position: nextPos,
        inherited_from_release: false,
      },
      { onConflict: "track_id,artist_profile_id" }
    )

  if (error) throw error
  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}

export async function removeTrackMainArtist(trackId: string, artistProfileId: string, releaseId: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("track_main_artists")
    .delete()
    .eq("track_id", trackId)
    .eq("artist_profile_id", artistProfileId)

  if (error) throw error
  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}

export async function removeInheritedTrackMainArtists(releaseId: string, artistIds: string[]) {
  if (artistIds.length === 0) return { success: true }
  const supabase = createServerClient()

  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id")
    .eq("release_id", releaseId)

  if (tracksError) throw tracksError
  if (!tracks || tracks.length === 0) return { success: true }

  const trackIds = tracks.map((t) => t.id)

  const { error } = await supabase
    .from("track_main_artists")
    .delete()
    .in("track_id", trackIds)
    .in("artist_profile_id", artistIds)
    .eq("inherited_from_release", true)

  if (error) throw error

  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}

export interface ContributorInput {
  artist_profile_id: string
  role: CreditRole
  role_custom?: string | null
}

export async function fanOutTrackContributors(releaseId: string, contributors: ContributorInput[]) {
  if (contributors.length === 0) return { success: true }

  const supabase = createServerClient()

  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id")
    .eq("release_id", releaseId)
    .order("position")

  if (tracksError) throw tracksError
  if (!tracks || tracks.length === 0) return { success: true }

  for (const track of tracks) {
    const rows = contributors.map((contrib) => ({
      track_id: track.id,
      artist_profile_id: contrib.artist_profile_id,
      role: contrib.role,
      role_custom: contrib.role_custom ?? null,
      inherited_from_release: true,
    }))

    const { error } = await supabase
      .from("track_contributors")
      .upsert(rows, { onConflict: "track_id,artist_profile_id,role", ignoreDuplicates: true })

    if (error) throw error
  }

  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}

export async function addTrackContributor(
  trackId: string,
  artistProfileId: string,
  role: CreditRole,
  releaseId: string,
  role_custom?: string | null
) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("track_contributors")
    .upsert(
      {
        track_id: trackId,
        artist_profile_id: artistProfileId,
        role,
        role_custom: role_custom ?? null,
        inherited_from_release: false,
      },
      { onConflict: "track_id,artist_profile_id,role" }
    )

  if (error) throw error
  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}

export async function removeTrackContributor(contributorId: string, releaseId: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("track_contributors")
    .delete()
    .eq("id", contributorId)

  if (error) throw error
  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}

export async function removeInheritedTrackContributors(releaseId: string, artistIds: string[]) {
  if (artistIds.length === 0) return { success: true }

  const supabase = createServerClient()

  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id")
    .eq("release_id", releaseId)

  if (tracksError) throw tracksError
  if (!tracks || tracks.length === 0) return { success: true }

  const trackIds = tracks.map((t) => t.id)

  const { error } = await supabase
    .from("track_contributors")
    .delete()
    .in("track_id", trackIds)
    .in("artist_profile_id", artistIds)
    .eq("inherited_from_release", true)

  if (error) throw error

  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}
