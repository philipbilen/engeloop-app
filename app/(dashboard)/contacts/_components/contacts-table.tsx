"use client"

import { memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SortableHeader, type SortOption } from "@/components/ui/sortable-header"
import { cn } from "@/lib/utils"

export type ContactSortColumn = "full_legal_name" | "company_name" | "email" | "updated_at"
export type ContactSortOption = SortOption<ContactSortColumn>

export interface ContactRow {
  id: string
  full_legal_name: string
  company_name: string | null
  email: string
  updated_at: string | null
}

interface ContactsTableProps {
  contacts: ContactRow[]
  currentSort: ContactSortOption
  onSortChange: (next: ContactSortOption) => void
  onSelectContact?: (id: string) => void
}

function formatLastUpdated(dateString: string | null) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const ContactRowComponent = memo(function ContactRow({
  contact,
  onSelect,
}: {
  contact: ContactRow
  onSelect?: (id: string) => void
}) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(contact.id)
    } else {
      router.push(`/contacts/${contact.id}`)
    }
  }, [router, contact.id, onSelect])

  const formattedDate = useMemo(() => formatLastUpdated(contact.updated_at), [contact.updated_at])

  return (
    <tr
      onClick={handleClick}
      className="transition-[background-color] duration-75 hover:bg-[var(--nord3)] cursor-pointer group even:bg-white/5"
    >
      {/* Name */}
      <td className="px-3 py-2.5 table-cell align-middle">
        <div className="text-[var(--text-bright)] font-semibold text-sm truncate max-w-[200px]" title={contact.full_legal_name}>
          {contact.full_legal_name}
        </div>
      </td>

      {/* Company */}
      <td className="px-3 py-2.5 table-cell align-middle">
        <div className="text-[var(--text-dim)] text-xs truncate max-w-[150px]" title={contact.company_name || ""}>
          {contact.company_name || "—"}
        </div>
      </td>

      {/* Email */}
      <td className="px-3 py-2.5 table-cell align-middle">
        <div className="text-[var(--text-dim)] text-xs truncate max-w-[200px]" title={contact.email}>
          {contact.email}
        </div>
      </td>

      {/* Updated */}
      <td className="px-3 py-2.5 text-[var(--text-dimmer)] text-xs table-cell align-middle text-right">
        {formattedDate}
      </td>
    </tr>
  )
})

ContactRowComponent.displayName = "ContactRow"

function ContactsTableComponent({ contacts, currentSort, onSortChange, onSelectContact }: ContactsTableProps) {
  return (
    <div className="overflow-x-auto bg-[var(--bg-main)]">
      <table className="w-full border-collapse text-left">
        <thead
          className="border-t border-b bg-[var(--nord2)]"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <tr>
            <th className="px-3 py-2 text-left">
              <SortableHeader
                column="full_legal_name"
                label="Legal Name"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2 text-left w-48">
              <SortableHeader
                column="company_name"
                label="Company"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2 text-left w-64">
              <SortableHeader
                column="email"
                label="Email"
                currentSort={currentSort}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2 text-right w-32">
              <SortableHeader
                column="updated_at"
                label="Updated"
                currentSort={currentSort}
                onSortChange={onSortChange}
                className="justify-end"
              />
            </th>
          </tr>
        </thead>
        <tbody className="border-separate border-spacing-0">
          {contacts.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-3 py-12 text-center text-[var(--text-dimmer)]"
              >
                No contacts found
              </td>
            </tr>
          ) : (
            contacts.map((contact) => (
              <ContactRowComponent
                key={contact.id}
                contact={contact}
                onSelect={onSelectContact}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export const ContactsTable = memo(ContactsTableComponent)

ContactsTable.displayName = "ContactsTable"
