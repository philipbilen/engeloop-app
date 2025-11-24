"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/lib/supabase/types";

type ArtistProfile = Database["public"]["Tables"]["artist_profiles"]["Row"];

export async function createArtistProfile(artistName: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("artist_profiles")
    .insert({ artist_name: artistName })
    .select()
    .single();

  if (error) throw error;

  // Revalidate paths where artists are listed
  revalidatePath("/releases");

  return data;
}

export async function getAllArtistProfiles() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("artist_profiles")
    .select("*")
    .order("artist_name");

  if (error) throw error;
  return data || [];
}

export async function searchArtists(query: string): Promise<ArtistProfile[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("artist_profiles")
    .select("*")
    .ilike("artist_name", `%${query}%`)
    .limit(20);

  if (error) {
    console.error("Error searching artists:", error);
    throw error;
  }

  return data || [];
}

export async function updateMainArtists(
  releaseId: string,
  artistIds: string[],
) {
  const supabase = createServerClient();

  try {
    // Delete existing main artists
    await supabase
      .from("release_main_artists")
      .delete()
      .eq("release_id", releaseId);

    // Insert new main artists with positions
    if (artistIds.length > 0) {
      const { error } = await supabase.from("release_main_artists").insert(
        artistIds.map((artist_profile_id, index) => ({
          release_id: releaseId,
          artist_profile_id,
          position: index,
        })),
      );

      if (error) throw error;
    }

    revalidatePath(`/releases/${releaseId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Error updating main artists:", error);
    throw error;
  }
}

export async function addMainArtist(releaseId: string, artistId: string) {
  const supabase = createServerClient();

  try {
    // Get current max position
    const { data: existing } = await supabase
      .from("release_main_artists")
      .select("position")
      .eq("release_id", releaseId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existing && existing.length > 0
      ? existing[0].position + 1
      : 0;

    const { error } = await supabase.from("release_main_artists").insert({
      release_id: releaseId,
      artist_profile_id: artistId,
      position: nextPosition,
    });

    if (error) throw error;

    revalidatePath(`/releases/${releaseId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Error adding main artist:", error);
    throw error;
  }
}

export async function removeMainArtist(releaseId: string, artistId: string) {
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from("release_main_artists")
      .delete()
      .eq("release_id", releaseId)
      .eq("artist_profile_id", artistId);

    if (error) throw error;

    revalidatePath(`/releases/${releaseId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Error removing main artist:", error);
    throw error;
  }
}
