"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/lib/supabase/types"

type CreditRole = Database["public"]["Enums"]["credit_role"]

export async function getContributorsByRelease(releaseId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("release_contributors")
    .select(`*, artist_profiles(*)`)
    .eq("release_id", releaseId)
    .order("created_at")

  if (error) throw error
  return data || []
}

export async function addContributor(
  releaseId: string,
  artistProfileId: string,
  role: CreditRole
) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("release_contributors")
    .upsert(
      {
        release_id: releaseId,
        artist_profile_id: artistProfileId,
        role: role,
      },
      {
        onConflict: "release_id,artist_profile_id",
        ignoreDuplicates: false,
      }
    )
    .select(`*, artist_profiles(*)`)
    .single()

  if (error) throw error
  revalidatePath(`/releases/${releaseId}/edit`)
  return data
}

export async function removeContributor(contributorId: string, releaseId: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("release_contributors")
    .delete()
    .eq("id", contributorId)

  if (error) throw error
  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}

export async function updateContributorRole(
  contributorId: string,
  releaseId: string,
  role: CreditRole
) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("release_contributors")
    .update({ role: role })
    .eq("id", contributorId)

  if (error) throw error
  revalidatePath(`/releases/${releaseId}/edit`)
  return { success: true }
}
