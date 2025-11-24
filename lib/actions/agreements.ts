"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAllAgreements() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAgreement(data: {
  label_share_percent: number;
  licensor_pool_percent: number;
  territory?: string | null;
  term_type?: string | null;
  term_value_years?: number | null;
  auto_renew_interval_years?: number | null;
  notice_period_days?: number | null;
  effective_at?: string | null;
  expires_at?: string | null;
  signatoryIds: string[];
}) {
  const supabase = createServerClient();

  try {
    const { signatoryIds, ...agreementData } = data;
    const { data: agreement, error } = await supabase
      .from("contracts")
      .insert({
        ...agreementData,
        term_type: agreementData.term_type as any,
        contract_type: "Release Schedule",
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    if (!agreement) throw new Error("Failed to create agreement");

    const { error: signatoriesError } = await supabase
      .from("contract_signatories")
      .insert(signatoryIds.map((contact_id) => ({
        contract_id: agreement.id,
        contact_id,
      })));

    if (signatoriesError) throw signatoriesError;

    return { success: true, agreement };
  } catch (error) {
    console.error("Error creating agreement:", error);
    throw error;
  }
}

export async function updateAgreement(
  agreementId: string,
  data: {
    status?: string;
    label_share_percent?: number;
    licensor_pool_percent?: number;
    territory?: string | null;
    executed_at?: string | null;
    notes?: string | null;
  },
) {
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from("contracts")
      .update({ ...data, status: data.status as any })
      .eq("id", agreementId);

    if (error) throw error;

    revalidatePath("/agreements");
    return { success: true };
  } catch (error) {
    console.error("Error updating agreement:", error);
    throw error;
  }
}

export async function linkAgreementToRelease(
  agreementId: string,
  releaseId: string,
) {
  const supabase = createServerClient();

  try {
    const { error } = await supabase.from("contract_releases").insert({
      contract_id: agreementId,
      release_id: releaseId,
    });

    if (error) throw error;

    revalidatePath(`/releases/${releaseId}/edit`);
    revalidatePath("/agreements");
    return { success: true };
  } catch (error) {
    console.error("Error linking agreement to release:", error);
    throw error;
  }
}

export async function unlinkAgreementFromRelease(
  agreementId: string,
  releaseId: string,
) {
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from("contract_releases")
      .delete()
      .eq("contract_id", agreementId)
      .eq("release_id", releaseId);

    if (error) throw error;

    revalidatePath(`/releases/${releaseId}/edit`);
    revalidatePath("/agreements");
    return { success: true };
  } catch (error) {
    console.error("Error unlinking agreement from release:", error);
    throw error;
  }
}

export async function getAgreementsByRelease(releaseId: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("contract_releases")
    .select(`
      contract:contracts(*)
    `)
    .eq("release_id", releaseId);

  if (error) throw error;
  return data?.map((cr) => cr.contract).filter(Boolean) || [];
}

export async function getAllContacts() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("full_legal_name", { ascending: true });

  if (error) throw error;
  return data || [];
}
