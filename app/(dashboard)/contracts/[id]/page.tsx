import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ContractDetailView } from "../_components/contract-detail-view"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ContractPage({ params }: PageProps) {
    const { id } = await params
    const supabase = createServerClient()

    // Fetch contract details
    const { data: contract } = await supabase
        .from("contracts")
        .select(`
      *,
      contract_signatories(
        contact_id,
        contacts(full_legal_name, email)
      ),
      contract_releases(
        releases(id, title, internal_catalog_id)
      )
    `)
        .eq("id", id)
        .single()

    if (!contract) {
        notFound()
    }

    // Fetch all contacts for the picker
    const { data: contacts } = await supabase
        .from("contacts")
        .select("id, full_legal_name, email")
        .order("full_legal_name")

    return (
        <ContractDetailView
            contract={contract}
            contacts={contacts || []}
        />
    )
}
