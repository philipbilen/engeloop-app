import { createServerClient } from "@/lib/supabase/server"
import { ClientContactsTable } from "./_components/client-contacts"
import type { ContactRow } from "./_components/contacts-table"
import type { ContactDetail } from "./_components/contact-summary-panel"

export default async function ContactsPage({
  searchParams,
}: {
  searchParams?: Promise<{ selected?: string }>
}) {
  const supabase = createServerClient()
  const resolvedSearch = searchParams ? await searchParams : {}
  const selectedId = resolvedSearch?.selected || null

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_legal_name, company_name, email, updated_at")
    .order("full_legal_name", { ascending: true })

  const tableData: ContactRow[] = contacts || []
  
  let selectedDetail: ContactDetail | null = null

  if (selectedId) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", selectedId)
      .single()
    
    if (contact) {
      selectedDetail = {
        id: contact.id,
        full_legal_name: contact.full_legal_name,
        email: contact.email,
        company_name: contact.company_name,
        full_postal_address: contact.full_postal_address,
        payout_info: contact.payout_info,
        updated_at: contact.updated_at,
      }
    }
  }

  return (
    <ClientContactsTable 
      contacts={tableData} 
      selectedContactId={selectedId}
      selectedDetail={selectedDetail}
    />
  )
}
