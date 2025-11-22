import { createServerClient } from "@/lib/supabase/server"
import { ClientContractsTable } from "./_components/client-contracts"
import type { ContractRow, ContractStatus, ContractType } from "./_components/contracts-table"

export default async function ContractsPage() {
    const supabase = createServerClient()

    const { data: contracts, error } = await supabase
        .from("contracts")
        .select(`
      id,
      contract_type,
      status,
      licensor_pool_percent,
      updated_at,
      contract_signatories(
        contacts(full_legal_name)
      ),
      contract_releases(count)
    `)
        .returns<any[]>() // TODO: Replace with proper generated types
        .order("updated_at", { ascending: false })

    if (error) {
        console.error("Error fetching contracts:", error)
    } else {
        console.log("Fetched contracts:", contracts?.length)
    }

    const tableData: ContractRow[] = contracts?.map((contract) => {
        // Map all signatories to licensors array
        const allLicensors = contract.contract_signatories?.map((s: any) => s.contacts?.full_legal_name).filter(Boolean) || []
        const licensors = Array.from(new Set(allLicensors)) as string[]
        if (licensors.length === 0) licensors.push("Unknown")

        return {
            id: contract.id,
            licensors: licensors,
            type: contract.contract_type as ContractType,
            status: contract.status as ContractStatus,
            pool_percent: contract.licensor_pool_percent,
            linked_releases_count: contract.contract_releases?.[0]?.count || 0,
            last_updated: contract.updated_at,
        }
    }) || []

    return <ClientContractsTable contracts={tableData} />
}
