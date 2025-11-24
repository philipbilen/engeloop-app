"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { ContactsTable, type ContactRow, type ContactSortOption, type ContactSortColumn } from "./contacts-table"
import { ContactSummaryPanel, type ContactDetail } from "./contact-summary-panel"
import type { SortDirection } from "@/components/ui/sortable-header"

interface ClientContactsTableProps {
  contacts: ContactRow[]
  selectedContactId?: string | null
  selectedDetail?: ContactDetail | null
}

function sortContacts(data: ContactRow[], sort: ContactSortOption) {
  const [column, direction] = sort.split("_") as [ContactSortColumn, SortDirection]
  const mod = direction === "asc" ? 1 : -1

  return [...data].sort((a, b) => {
    switch (column) {
      case "full_legal_name":
        return a.full_legal_name.localeCompare(b.full_legal_name) * mod
      case "company_name":
        return (a.company_name || "").localeCompare(b.company_name || "") * mod
      case "email":
        return a.email.localeCompare(b.email) * mod
      case "updated_at": {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
        return (dateA - dateB) * mod
      }
      default:
        return 0
    }
  })
}

export function ClientContactsTable({ contacts, selectedContactId = null, selectedDetail = null }: ClientContactsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [sort, setSort] = useState<ContactSortOption>("full_legal_name_asc")
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedContactId ?? null)
  const activeContactId = selectedContactId ?? localSelectedId

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return contacts

    return contacts.filter((contact) => {
      const haystack = `${contact.full_legal_name} ${contact.company_name || ""} ${contact.email}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [contacts, searchTerm])

  const sorted = useMemo(() => sortContacts(filtered, sort), [filtered, sort])

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const handleSortChange = useCallback((next: ContactSortOption) => {
    setSort(next)
  }, [])

  const handleSelectContact = useCallback((id: string) => {
    setLocalSelectedId(id)
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("selected", id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  return (
    <div className="min-h-screen space-y-8">
      <div className="grid grid-cols-12 gap-8">
        <section className="col-span-12 xl:col-span-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-bright)] font-sans">Contacts</h1>
              <p className="text-sm text-[var(--text-dimmer)]">
                Manage legal entities, companies, and payout recipients
              </p>
            </div>
            <Button size="lg">
              + New Contact
            </Button>
          </div>

          {/* Controls */}
          <div className="space-y-4 pb-4">
            <div className="w-full md:max-w-md">
              <SearchBar 
                value={searchTerm} 
                onChange={handleSearchChange} 
                placeholder="Search contacts..."
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-dimmer)]">
              <span className="font-mono">{sorted.length} results</span>
            </div>
            <div className="h-px bg-[var(--border-primary)]" />
          </div>

          {/* Table Section */}
          <div className="overflow-hidden">
            <ContactsTable
              contacts={sorted}
              currentSort={sort}
              onSortChange={handleSortChange}
              onSelectContact={handleSelectContact}
            />
          </div>
        </section>

        {/* Sidebar */}
        <aside className="col-span-12 xl:col-span-4 space-y-6">
          <ContactSummaryPanel
            activeContactId={activeContactId}
            selectedDetail={selectedDetail}
            totalCount={contacts.length}
          />
        </aside>
      </div>
    </div>
  )
}
