"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/lib/supabase/types"

type ShareInsert = Database["public"]["Tables"]["licensor_shares"]["Insert"]

export async function getSharesByTrack(trackId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("licensor_shares")
    .select(`*, contacts(*)`)
    .eq("track_id", trackId)
    .order("created_at")

  if (error) throw error
  return data || []
}

export async function updateTrackShares(trackId: string, shares: ShareInsert[]) {
  const supabase = createServerClient()

  // Use a transaction to ensure atomicity
  const { error: deleteError } = await supabase
    .from("licensor_shares")
    .delete()
    .eq("track_id", trackId)

  if (deleteError) {
    console.error("Error deleting old shares:", deleteError)
    throw new Error("Failed to update shares (deletion step).")
  }

  if (shares.length > 0) {
    const { error: insertError } = await supabase
      .from("licensor_shares")
      .insert(shares)

    if (insertError) {
      console.error("Error inserting new shares:", insertError)
      throw new Error("Failed to update shares (insertion step).")
    }
  }

  // Revalidate the path to update the UI
  revalidatePath(`/releases/`)
  
  return { success: true }
}