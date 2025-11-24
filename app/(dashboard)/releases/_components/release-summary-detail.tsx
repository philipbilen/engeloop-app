import Link from "next/link"
import { StatusBadge, type ReleaseStatus } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ReleaseDetail {
  id: string
  title: string
  status: ReleaseStatus
  internal_catalog_id: string
  release_date: string | null
  type: string
  upc: string | null
  main_artists: string[]
  tracks: Array<{
    id: string
    title: string
    isrc: string | null
    contributors: Array<{ name: string; role: string; inherited?: boolean }>
    licensor_shares: Array<{ name: string; share_percent: number }>
  }>
  finance: {
    label_share_percent: number | null
    licensor_pool_percent: number | null
    term: string | null
  }
}

interface ReleaseSummaryDetailProps {
  detail: ReleaseDetail
}

export function ReleaseSummaryDetail({ detail }: ReleaseSummaryDetailProps) {
  const missingDate = !detail.release_date
  const missingUpc = !detail.upc
  const tracksMissingIsrc = detail.tracks.filter((t) => !t.isrc).length
  const financeIncomplete =
    !detail.finance.label_share_percent ||
    !detail.finance.licensor_pool_percent ||
    detail.tracks.some((t) => t.licensor_shares.length === 0)

  return (
    <div className="h-full flex flex-col border-l border-[var(--border-primary)] bg-[var(--nord1)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* === HEADER === */}
          <div className="px-4 py-4 border-b border-[var(--border-primary)] bg-[var(--nord1)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.status} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-bright)] leading-tight font-mono">
                  {detail.title}
                </h2>
                <p className="text-xs text-[var(--text-dimmer)] uppercase tracking-wide">
                  {detail.main_artists.join(", ") || "No artists"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/releases">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] border border-[var(--border-primary)]">
                    ✕
                  </Button>
                </Link>
                <Link href={`/releases/${detail.id}/edit`}>
                  <Button size="sm" variant="secondary" className="h-7 w-7 p-0 border border-[var(--border-primary)]">
                    <Pencil className="w-3 h-3" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* === SECTION 1: CORE INFO === */}
          <StructuralSection
            title="CORE INFO"
            href={`/releases/${detail.id}/edit#core-info`}
            warnings={[
              missingDate ? "DATE MISSING" : null,
              missingUpc ? "UPC MISSING" : null,
            ]}
          >
            <div className="space-y-1">
              <DataField label="CATALOG ID" value={detail.internal_catalog_id || "—"} mono />
              <DataField label="TYPE" value={detail.type} />
              <DataField label="RELEASE DATE" value={formatDate(detail.release_date) || "—"} />
              <DataField label="UPC" value={detail.upc || "—"} mono alert={!detail.upc} />
            </div>
          </StructuralSection>

          {/* === SECTION 2: CREDITS === */}
          <StructuralSection
            title="CREDITS"
            href={`/releases/${detail.id}/edit#artists-credits`}
          >
            <div className="space-y-2">
              {renderContributors(detail.tracks)}
            </div>
          </StructuralSection>

          {/* === SECTION 3: TRACKS === */}
          <StructuralSection
            title={`TRACKS (${detail.tracks.length})`}
            href={`/releases/${detail.id}/edit#tracks`}
            warnings={[tracksMissingIsrc ? `${tracksMissingIsrc} MISSING ISRC` : null]}
          >
            <div className="space-y-1">
              {detail.tracks.slice(0, 5).map((track, i) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between py-2 px-2 border border-[var(--border-primary)] hover:bg-[var(--nord3)] transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    <span className="text-[10px] font-mono text-[var(--text-dimmer)] w-5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-bright)] truncate">
                      {track.title}
                    </span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono shrink-0 font-bold uppercase",
                    track.isrc ? "text-[var(--text-dimmer)]" : "text-[var(--aurora-red)]"
                  )}>
                    {track.isrc || "MISSING"}
                  </span>
                </div>
              ))}
              {detail.tracks.length > 5 && (
                <Link 
                  href={`/releases/${detail.id}/edit#tracks`}
                  className="block px-2 py-1 text-[10px] text-[var(--frost-cyan)] hover:text-[var(--frost-blue)] transition-colors font-mono"
                >
                  + {detail.tracks.length - 5} MORE TRACKS
                </Link>
              )}
            </div>
          </StructuralSection>

          {/* === SECTION 4: FINANCE === */}
          <StructuralSection
            title="FINANCE"
            href={`/releases/${detail.id}/edit#financials`}
            warnings={[financeIncomplete ? "INCOMPLETE" : null]}
          >
            <div className="space-y-2">
              {/* Finance Table */}
              <div className="border border-[var(--border-primary)]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)] bg-[var(--nord1)]">
                      <th className="px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-dimmer)]">
                        Role
                      </th>
                      <th className="px-2 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--text-dimmer)]">
                        Share %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--border-primary)]">
                      <td className="px-2 py-2 text-[var(--text-bright)]">Label</td>
                      <td className="px-2 py-2 text-right font-mono text-[var(--text-bright)]">
                        {detail.finance.label_share_percent != null ? `${detail.finance.label_share_percent.toFixed(2)}%` : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 text-[var(--text-bright)]">Licensor Pool</td>
                      <td className="px-2 py-2 text-right font-mono text-[var(--text-bright)]">
                        {detail.finance.licensor_pool_percent != null ? `${detail.finance.licensor_pool_percent.toFixed(2)}%` : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Licensor Splits */}
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-dimmer)]">
                  LICENSOR SPLITS
                </p>
                {renderLicensorShares(detail.tracks)}
              </div>

              <DataField label="TERM" value={detail.finance.term || "—"} />
            </div>
          </StructuralSection>
        </div>
      </div>
    </div>
  )
}

function StructuralSection({
  title,
  href,
  children,
  warnings = [],
}: {
  title: string
  href: string
  children: React.ReactNode
  warnings?: Array<string | null>
}) {
  const activeWarnings = warnings.filter(Boolean) as string[]
  return (
    <div className="border-b border-[var(--border-primary)] last:border-0">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--nord1)]">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--frost-cyan)]">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {activeWarnings.length > 0 && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--aurora-red)] border border-[var(--aurora-red)] px-1.5 py-0.5">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>
                {activeWarnings.length > 1 
                  ? `${activeWarnings.length} ISSUES` 
                  : activeWarnings[0]
                }
              </span>
            </div>
          )}
          <Link
            href={href}
            className="text-[9px] font-bold text-[var(--frost-blue)] hover:text-[var(--frost-cyan)] transition-colors uppercase tracking-wider"
          >
            EDIT
          </Link>
        </div>
      </div>
      <div className="px-4 py-2">
        {children}
      </div>
    </div>
  )
}

function DataField({ label, value, mono = false, alert = false }: { label: string; value: string; mono?: boolean; alert?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border border-[var(--border-primary)] px-2 py-1.5 gap-3">
      <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-dimmer)]">
        {label}
      </span>
      <span className={cn(
        "text-xs font-medium text-right flex-shrink-0",
        mono && "font-mono",
        alert ? "text-[var(--aurora-red)]" : "text-[var(--text-bright)]"
      )}>
        {value}
      </span>
    </div>
  )
}

function renderContributors(tracks: ReleaseDetail["tracks"]) {
  const contributors: Record<string, Set<string>> = {}
  tracks.forEach((t) => {
    t.contributors.forEach((c) => {
      if (!contributors[c.role]) contributors[c.role] = new Set()
      contributors[c.role].add(c.name)
    })
  })

  const entries = Object.entries(contributors)
  if (entries.length === 0) return <p className="text-[var(--text-dimmer)] text-xs italic">No contributors listed</p>

  return (
    <div className="space-y-1">
      {entries.map(([role, names]) => (
        <div key={role} className="flex items-baseline justify-between border border-[var(--border-primary)] px-2 py-1.5">
          <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-dimmer)]">{role}</span>
          <span className="text-xs text-[var(--text-bright)] text-right font-medium max-w-[60%] truncate" title={Array.from(names).join(", ")}>
            {Array.from(names).join(", ")}
          </span>
        </div>
      ))}
    </div>
  )
}

function renderLicensorShares(tracks: ReleaseDetail["tracks"]) {
  const shares: Record<string, number> = {}

  tracks.forEach((t) => {
    t.licensor_shares.forEach((s) => {
      shares[s.name] = (shares[s.name] || 0) + Number(s.share_percent || 0)
    })
  })

  const entries = Object.entries(shares)
  if (entries.length === 0) return <p className="text-[var(--text-dimmer)] text-xs italic">No splits recorded</p>

  return (
    <div className="border border-[var(--border-primary)]">
      <table className="w-full text-xs">
        <tbody>
          {entries.map(([name, percent]) => (
            <tr key={name} className="border-b last:border-0 border-[var(--border-primary)]">
              <td className="px-2 py-1.5 text-[var(--text-dimmer)] pl-4 flex items-center gap-2">
                <span className="text-[var(--text-dim)] opacity-50">↳</span>
                {name}
              </td>
              <td className="px-2 py-1.5 font-mono text-[var(--text-bright)] text-right">{percent.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatDate(dateString: string | null) {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  } catch {
    return dateString
  }
}
