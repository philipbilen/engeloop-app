"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import { Pencil, FileText, Users, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContractStatus, ContractType } from "./contracts-table"

export interface ContractDetail {
  id: string
  contract_type: ContractType
  status: ContractStatus
  licensor_pool_percent: number | null
  updated_at: string | null
  licensors: string[]
  linked_releases_count: number
}

interface ContractSummaryPanelProps {
  activeContractId: string | null
  selectedDetail: ContractDetail | null
  totalCount: number
}

export function ContractSummaryPanel({ activeContractId, selectedDetail, totalCount }: ContractSummaryPanelProps) {
  if (selectedDetail && activeContractId === selectedDetail.id) {
    return <ContractDetailView detail={selectedDetail} />
  }

  return (
    <div className="h-full border-l border-[var(--border-primary)] bg-[var(--nord1)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dimmer)]">Context</p>
          <h3 className="text-lg font-semibold text-[var(--text-bright)]">Summary</h3>
        </div>
        <span className="rounded-full bg-[var(--bg-interactive)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
          {totalCount} Contracts
        </span>
      </div>

      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 text-center">
        <p className="text-sm text-[var(--text-dimmer)]">
          Select a contract to view terms, signatories, and linked releases.
        </p>
      </div>
    </div>
  )
}

function ContractDetailView({ detail }: { detail: ContractDetail }) {
  return (
    <div className="h-full flex flex-col border-l border-[var(--border-primary)] bg-[var(--nord1)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* === HEADER === */}
          <div className="px-4 py-4 border-b border-[var(--border-primary)] bg-[var(--nord1)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.status as any} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-bright)] leading-tight font-sans">
                  {detail.licensors.join(", ") || "Unknown Licensor"}
                </h2>
                <p className="text-xs text-[var(--text-dimmer)] uppercase tracking-wide flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {detail.contract_type}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/contracts">
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

          {/* === SECTION 1: TERMS === */}
          <StructuralSection title="TERMS">
            <div className="space-y-1">
              <DataField 
                label="POOL PERCENT" 
                value={detail.licensor_pool_percent !== null ? `${detail.licensor_pool_percent}%` : "—"} 
                icon={<Percent className="w-3 h-3 text-[var(--text-dimmer)]" />}
                mono
              />
              <DataField 
                label="LINKED RELEASES" 
                value={String(detail.linked_releases_count)} 
                mono
              />
            </div>
          </StructuralSection>

          {/* === SECTION 2: SIGNATORIES === */}
          <StructuralSection title="SIGNATORIES">
            <div className="space-y-2">
              {detail.licensors.length > 0 ? (
                detail.licensors.map((licensor, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-bright)] border border-[var(--border-primary)] px-3 py-2 bg-[var(--bg-tertiary)]">
                    <Users className="w-3 h-3 text-[var(--text-dimmer)]" />
                    {licensor}
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-dimmer)] text-xs italic">No signatories listed</p>
              )}
            </div>
          </StructuralSection>

          {/* === SECTION 3: METADATA === */}
          <StructuralSection title="METADATA">
            <div className="space-y-1">
              <DataField 
                label="ID" 
                value={detail.id} 
                mono
              />
              <DataField 
                label="LAST UPDATED" 
                value={formatDate(detail.updated_at) || "—"} 
              />
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

function DataField({ label, value, mono = false, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border border-[var(--border-primary)] px-2 py-1.5 gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-dimmer)]">
          {label}
        </span>
      </div>
      <span className={cn(
        "text-xs font-medium text-right flex-shrink-0 text-[var(--text-bright)]",
        mono && "font-mono"
      )}>
        {value}
      </span>
    </div>
  )
}

function formatDate(dateString: string | null) {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return dateString
  }
}
