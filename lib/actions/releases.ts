"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export interface CreateReleaseData {
  title: string
  type: "Single" | "EP" | "Album"
  release_date: string | null
  artist_ids: string[] // Array of artist_profile IDs in order
}

export async function createRelease(data: CreateReleaseData) {
  const supabase = createServerClient()

  try {
    console.log("Creating release with data:", data)

    // 1. Generate catalog number
    const { data: catalogNumber, error: catalogError } = await supabase.rpc(
      "generate_catalog_number",
      {
        p_release_date: data.release_date,
        p_base_catalog_id: null,
      }
    )

    console.log("Catalog number result:", { catalogNumber, catalogError })

    if (catalogError) {
      console.error("Catalog generation error:", catalogError)
      throw catalogError
    }
    if (!catalogNumber) throw new Error("Failed to generate catalog number")

    // 2. Create release
    const { data: release, error: releaseError } = await supabase
      .from("releases")
      .insert({
        title: data.title,
        type: data.type,
        release_date: data.release_date,
        internal_catalog_id: catalogNumber,
        status: "planning",
      })
      .select()
      .single()

    console.log("Release creation result:", { release, releaseError })

    if (releaseError) {
      console.error("Release creation error:", releaseError)
      throw releaseError
    }
    if (!release) throw new Error("Failed to create release")

    // 3. Create main artists with positions
    if (data.artist_ids.length > 0) {
      const { error: artistsError } = await supabase
        .from("release_main_artists")
        .insert(
          data.artist_ids.map((artist_id, index) => ({
            release_id: release.id,
            artist_profile_id: artist_id,
            position: index + 1,
          }))
        )

      if (artistsError) throw artistsError
    }

    // 4. If type is Single, create a default track
    if (data.type === "Single") {
      await supabase.from("tracks").insert({
        release_id: release.id,
        title: data.title,
        explicit: false,
      })
    }

    revalidatePath("/releases")
    redirect(`/releases/${release.id}/edit`)
  } catch (error) {
    console.error("Error creating release:", error)
    throw error
  }
}

export async function updateRelease(
  releaseId: string,
  updates: {
    title?: string
    version?: string | null
    release_date?: string | null
    primary_genre?: string | null
    upc?: string | null
    cover_art_url?: string | null
  }
) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase
      .from("releases")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", releaseId)

    if (error) throw error

    revalidatePath(`/releases/${releaseId}/edit`)
  } catch (error) {
    console.error("Error updating release:", error)
    throw error
  }
}

export async function updateReleaseStatus(
  releaseId: string,
  newStatus: "planning" | "signed" | "in_progress" | "delivered" | "released" | "archived"
) {
  const supabase = createServerClient()

  try {
    // If advancing to delivered or released, validate shares
    if (newStatus === "delivered" || newStatus === "released") {
      const { data: validation, error: validationError } = await supabase.rpc(
        "validate_release_shares",
        { p_release_id: releaseId }
      )

      if (validationError) throw validationError

      const result = validation?.[0]
      if (!result?.all_valid) {
        return {
          success: false,
          error: "Cannot advance status: some tracks have invalid licensor shares",
          invalidTracks: result?.invalid_tracks || [],
        }
      }
    }

    // Update status
    const { error } = await supabase
      .from("releases")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", releaseId)

    if (error) throw error

    revalidatePath(`/releases/${releaseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error("Error updating release status:", error)
    throw error
  }
}
