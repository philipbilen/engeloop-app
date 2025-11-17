"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllContracts() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createContract(data: {
  title: string
  type: string
  label_share_percent: number
  licensor_pool_percent: number
  start_date?: string | null
  end_date?: string | null
  territory?: string | null
  document_url?: string | null
  notes?: string | null
}) {
  const supabase = createServerClient()

  try {
    const { data: contract, error } = await supabase
      .from("contracts")
      .insert({
        ...data,
        status: "draft",
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, contract }
  } catch (error) {
    console.error("Error creating contract:", error)
    throw error
  }
}

export async function updateContract(
  contractId: string,
  data: {
    title?: string
    type?: string
    status?: string
    label_share_percent?: number
    licensor_pool_percent?: number
    start_date?: string | null
    end_date?: string | null
    territory?: string | null
    document_url?: string | null
    executed_at?: string | null
    notes?: string | null
  }
) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase
      .from("contracts")
      .update(data)
      .eq("id", contractId)

    if (error) throw error

    revalidatePath("/contracts")
    return { success: true }
  } catch (error) {
    console.error("Error updating contract:", error)
    throw error
  }
}

export async function linkContractToRelease(
  contractId: string,
  releaseId: string
) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("contract_releases").insert({
      contract_id: contractId,
      release_id: releaseId,
    })

    if (error) throw error

    revalidatePath(`/releases/${releaseId}/edit`)
    revalidatePath("/contracts")
    return { success: true }
  } catch (error) {
    console.error("Error linking contract to release:", error)
    throw error
  }
}

export async function unlinkContractFromRelease(
  contractId: string,
  releaseId: string
) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase
      .from("contract_releases")
      .delete()
      .eq("contract_id", contractId)
      .eq("release_id", releaseId)

    if (error) throw error

    revalidatePath(`/releases/${releaseId}/edit`)
    revalidatePath("/contracts")
    return { success: true }
  } catch (error) {
    console.error("Error unlinking contract from release:", error)
    throw error
  }
}

export async function getContractsByRelease(releaseId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("contract_releases")
    .select(`
      contract:contracts(*)
    `)
    .eq("release_id", releaseId)

  if (error) throw error
  return data?.map((cr) => cr.contract).filter(Boolean) || []
}
