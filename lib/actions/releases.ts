"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Database } from "@/lib/supabase/types";

export interface CreateReleaseData {
  title: string;
  type: "Single" | "EP" | "Album";
  release_date: string | null;
  artist_ids: string[]; // Array of artist_profile IDs in order
  contributors?: Array<{
    artist_profile_id: string;
    role: Database["public"]["Enums"]["credit_role"];
    role_custom?: string | null;
  }>;
}

export async function createRelease(data: CreateReleaseData) {
  const supabase = createServerClient();

  try {
    const { data: created, error } = await supabase.rpc("create_release_full", {
      p_title: data.title,
      p_type: data.type,
      p_release_date: (data.release_date || null) as any,
      p_artist_ids: data.artist_ids,
      p_contributors: data.contributors || [],
    });

    if (error) throw error;

    const result = Array.isArray(created) ? created[0] : created;
    if (!result?.release_id) {
      throw new Error("Failed to create release (missing id)");
    }

    revalidatePath("/releases");
    redirect(`/releases/${result.release_id}/edit`);
  } catch (error) {
    throw error;
  }
}

export async function updateRelease(
  releaseId: string,
  updates: {
    title?: string;
    version?: string | null;
    release_date?: string | null;
    primary_genre?: string | null;
    upc?: string | null;
    cover_art_url?: string | null;
  },
) {
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from("releases")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", releaseId);

    if (error) throw error;

    revalidatePath(`/releases/${releaseId}/edit`);
  } catch (error) {
    throw error;
  }
}

export async function updateReleaseStatus(
  releaseId: string,
  newStatus:
    | "planning"
    | "signed"
    | "in_progress"
    | "delivered"
    | "released"
    | "archived",
) {
  const supabase = createServerClient();

  try {
    // If advancing to delivered or released, validate shares
    if (newStatus === "delivered" || newStatus === "released") {
      const { data: validation, error: validationError } = await supabase.rpc(
        "validate_release_shares",
        { p_release_id: releaseId },
      );

      if (validationError) throw validationError;

      const result = validation?.[0];
      if (!result?.all_valid) {
        return {
          success: false,
          error:
            "Cannot advance status: some tracks have invalid licensor shares",
          invalidTracks: result?.invalid_tracks || [],
        };
      }
    }

    // Update status
    const { error } = await supabase
      .from("releases")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", releaseId);

    if (error) throw error;

    revalidatePath(`/releases/${releaseId}/edit`);
    return { success: true };
  } catch (error) {
    throw error;
  }
}
