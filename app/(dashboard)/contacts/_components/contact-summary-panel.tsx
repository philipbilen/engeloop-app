"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pencil, Mail, Building2, MapPin, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ContactDetail {
  id: string
  full_legal_name: string
  email: string
  company_name: string | null
  full_postal_address: string | null
  payout_info: any | null
  updated_at: string | null
}

interface ContactSummaryPanelProps {
  activeContactId: string | null
  selectedDetail: ContactDetail | null
  totalCount: number
}

export function ContactSummaryPanel({ activeContactId, selectedDetail, totalCount }: ContactSummaryPanelProps) {
  if (selectedDetail && activeContactId === selectedDetail.id) {
    return <ContactDetailView detail={selectedDetail} />
  }

  return (
    <div className="h-full border-l border-[var(--border-primary)] bg-[var(--nord1)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dimmer)]">Context</p>
          <h3 className="text-lg font-semibold text-[var(--text-bright)]">Summary</h3>
        </div>
        <span className="rounded-full bg-[var(--bg-interactive)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
          {totalCount} Contacts
        </span>
      </div>

      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 text-center">
        <p className="text-sm text-[var(--text-dimmer)]">
          Select a contact to view their details, payout info, and associated contracts.
        </p>
      </div>
    </div>
  )
}

function ContactDetailView({ detail }: { detail: ContactDetail }) {
  return (
    <div className="h-full flex flex-col border-l border-[var(--border-primary)] bg-[var(--nord1)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* === HEADER === */}
          <div className="px-4 py-4 border-b border-[var(--border-primary)] bg-[var(--nord1)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h2 className="text-xl font-bold text-[var(--text-bright)] leading-tight font-sans">
                  {detail.full_legal_name}
                </h2>
                {detail.company_name && (
                  <p className="text-xs text-[var(--text-dimmer)] uppercase tracking-wide flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {detail.company_name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/contacts">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] border border-[var(--border-primary)]">
                    ✕
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" className="h-7 w-7 p-0 border border-[var(--border-primary)]">
                  <Pencil className="w-3 h-3" />
                  <span className="sr-only">Edit</span>
                </Button>
              </div>
            </div>
          </div>

          {/* === SECTION 1: CONTACT INFO === */}
          <StructuralSection title="CONTACT INFO">
            <div className="space-y-1">
              <DataField 
                label="EMAIL" 
                value={detail.email} 
                icon={<Mail className="w-3 h-3 text-[var(--text-dimmer)]" />}
              />
              <DataField 
                label="ADDRESS" 
                value={detail.full_postal_address || "—"} 
                icon={<MapPin className="w-3 h-3 text-[var(--text-dimmer)]" />}
              />
            </div>
          </StructuralSection>

          {/* === SECTION 2: PAYOUT INFO === */}
          <StructuralSection title="PAYOUT DETAILS">
            <div className="space-y-1">
              {detail.payout_info ? (
                <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
                  <pre className="text-[10px] font-mono text-[var(--text-dim)] whitespace-pre-wrap">
                    {JSON.stringify(detail.payout_info, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[var(--text-dimmer)] text-xs italic border border-[var(--border-primary)] px-3 py-2 border-dashed">
                  <CreditCard className="w-3 h-3" />
                  No payout info configured
                </div>
              )}
            </div>
          </StructuralSection>
        </div>
      </div>
    </div>
  )
}

function StructuralSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[var(--border-primary)] last:border-0">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--nord1)]">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--frost-cyan)]">
          {title}
        </h3>
      </div>
      <div className="px-4 py-2">
        {children}
      </div>
    </div>
  )
}

function DataField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border border-[var(--border-primary)] px-2 py-1.5 gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-dimmer)]">
          {label}
        </span>
      </div>
      <span className="text-xs font-medium text-right flex-shrink-0 text-[var(--text-bright)]">
        {value}
      </span>
    </div>
  )
}
