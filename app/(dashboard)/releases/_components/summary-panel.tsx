"use client"

import { Card } from "@/components/ui/card"
import { ReleaseSummaryDetail, type ReleaseDetail } from "./release-summary-detail"

interface SummaryPanelProps {
  activeReleaseId: string | null
  selectedDetail: ReleaseDetail | null
  statusCounts: Record<string, number>
  totalCount: number
}

export function SummaryPanel({ activeReleaseId, selectedDetail, statusCounts, totalCount }: SummaryPanelProps) {
  if (selectedDetail && activeReleaseId === selectedDetail.id) {
    return <ReleaseSummaryDetail detail={selectedDetail} />
  }

  return (
    <div className="h-full border-l border-[var(--border-primary)] bg-[var(--nord1)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dimmer)]">Context</p>
          <h3 className="text-lg font-semibold text-[var(--text-bright)]">Summary</h3>
        </div>
        <span className="rounded-full bg-[var(--bg-interactive)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
          {totalCount} Releases
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Planning/Signoff" value={(statusCounts.planning || 0) + (statusCounts.signed || 0)} />
        <Stat label="In Motion" value={(statusCounts.in_progress || 0) + (statusCounts.ready_for_delivery || 0)} />
        <Stat label="Shipped" value={(statusCounts.delivered || 0) + (statusCounts.released || 0)} />
        <Stat label="Archived" value={statusCounts.archived || 0} />
      </div>

      <p className="text-sm text-[var(--text-dimmer)]">
        Click a release row to lock this panel to its details.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2">
      <p className="text-[11px] uppercase font-semibold tracking-wide text-[var(--text-dimmer)]">{label}</p>
      <div className="text-xl font-semibold text-[var(--text-bright)]">{value}</div>
    </div>
  )
}
