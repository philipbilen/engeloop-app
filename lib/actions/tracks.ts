"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createTrack(releaseId: string) {
  const supabase = createServerClient()

  try {
    // Get the current max position
    const { data: existing } = await supabase
      .from("tracks")
      .select("position")
      .eq("release_id", releaseId)
      .order("position", { ascending: false })
      .limit(1)

    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

    const { data: track, error } = await supabase
      .from("tracks")
      .insert({
        release_id: releaseId,
        title: `Track ${nextPosition + 1}`,
        position: nextPosition,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/releases/${releaseId}/edit`)
    return { success: true, track }
  } catch (error) {
    console.error("Error creating track:", error)
    throw error
  }
}

export async function updateTrack(
  trackId: string,
  releaseId: string,
  data: {
    title?: string
    version?: string | null
    duration_ms?: number | null
    isrc?: string | null
  }
) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase
      .from("tracks")
      .update(data)
      .eq("id", trackId)

    if (error) throw error

    revalidatePath(`/releases/${releaseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error("Error updating track:", error)
    throw error
  }
}

export async function deleteTrack(trackId: string, releaseId: string) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("tracks").delete().eq("id", trackId)

    if (error) throw error

    revalidatePath(`/releases/${releaseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting track:", error)
    throw error
  }
}

export async function reorderTracks(
  releaseId: string,
  trackIds: string[]
) {
  const supabase = createServerClient()

  try {
    // Update positions for all tracks
    for (let i = 0; i < trackIds.length; i++) {
      await supabase
        .from("tracks")
        .update({ position: i })
        .eq("id", trackIds[i])
    }

    revalidatePath(`/releases/${releaseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error("Error reordering tracks:", error)
    throw error
  }
}
