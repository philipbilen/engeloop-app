"use client"

import Link from "next/link"
import { StatusBadge, type ReleaseStatus } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

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
    <Card padding="lg" className="space-y-4 sticky top-8">
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dimmer)]">Release</p>
          <div className="text-lg font-semibold text-[var(--text-bright)]">{detail.title}</div>
          <div className="text-xs text-[var(--text-dimmer)] flex gap-2 flex-wrap">
            <span>Catalog: {detail.internal_catalog_id}</span>
            <span>Type: {detail.type}</span>
          </div>
        </div>
        <StatusBadge status={detail.status} />
      </header>

      <Section
        title="Core Info"
        href={`/releases/${detail.id}/edit#core-info`}
        warnings={[
          missingDate ? "Release date missing" : null,
          missingUpc ? "UPC missing" : null,
        ]}
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="Catalog" value={detail.internal_catalog_id || "—"} />
          <InfoRow label="Release Date" value={formatDate(detail.release_date) || "—"} />
          <InfoRow label="UPC" value={detail.upc || "—"} />
          <InfoRow label="Type" value={detail.type} />
        </div>
      </Section>

      <Section title="Artists & Contributors" href={`/releases/${detail.id}/edit#artists-credits`}>
        <div className="space-y-2 text-sm">
          <InfoRow label="Main Artists" value={detail.main_artists.join(", ") || "—"} />
          <div>
            <p className="text-[11px] uppercase font-semibold tracking-wide text-[var(--text-dimmer)]">Contributors</p>
            {renderContributors(detail.tracks)}
          </div>
        </div>
      </Section>

      <Section
        title="Tracks"
        href={`/releases/${detail.id}/edit#tracks`}
        warnings={[tracksMissingIsrc ? `${tracksMissingIsrc} track(s) missing ISRC` : null]}
      >
        <div className="space-y-2">
          {detail.tracks.slice(0, 6).map((track) => (
            <div key={track.id} className="flex items-center justify-between text-sm">
              <div className="font-semibold text-[var(--text-bright)]">{track.title}</div>
              <div className="text-[var(--text-dimmer)]">{track.isrc || "ISRC missing"}</div>
            </div>
          ))}
          {detail.tracks.length > 6 && (
            <p className="text-xs text-[var(--text-dimmer)]">+{detail.tracks.length - 6} more track(s)</p>
          )}
        </div>
      </Section>

      <Section
        title="Finance"
        href={`/releases/${detail.id}/edit#financials`}
        warnings={[financeIncomplete ? "Splits or schedule incomplete" : null]}
      >
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow
              label="Label / Licensor"
              value={
                detail.finance.label_share_percent != null && detail.finance.licensor_pool_percent != null
                  ? `${detail.finance.label_share_percent}% / ${detail.finance.licensor_pool_percent}%`
                  : "—"
              }
            />
            <InfoRow label="Term" value={detail.finance.term || "—"} />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase font-semibold tracking-wide text-[var(--text-dimmer)]">Licensor Splits</p>
            <div className="space-y-1">
              {renderLicensorShares(detail.tracks)}
            </div>
          </div>
        </div>
      </Section>
    </Card>
  )
}

function Section({
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Link href={href} className="text-sm font-semibold text-[var(--accent-primary)] hover:underline">
          {title}
        </Link>
        {activeWarnings.length > 0 && (
          <span className="text-[11px] rounded-full bg-orange-50 px-2 py-1 font-semibold uppercase tracking-wide text-orange-700">
            {activeWarnings[0]}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase font-semibold tracking-wide text-[var(--text-dimmer)]">{label}</p>
      <p className="text-sm text-[var(--text-bright)]">{value}</p>
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
  if (entries.length === 0) return <p className="text-[var(--text-dimmer)] text-sm">No contributors</p>

  return (
    <div className="space-y-1">
      {entries.map(([role, names]) => (
        <div key={role} className="flex items-start gap-2 text-sm">
          <span className="font-semibold text-[var(--text-bright)]">{role}:</span>
          <span className="text-[var(--text-dimmer)]">{Array.from(names).join(", ")}</span>
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
  if (entries.length === 0) return <p className="text-[var(--text-dimmer)] text-sm">No splits recorded</p>

  return (
    <div className="space-y-1">
      {entries.map(([name, percent]) => (
        <div key={name} className="flex items-center justify-between text-sm rounded-md border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-2 py-1">
          <span className="text-[var(--text-bright)]">{name}</span>
          <span className="font-semibold text-[var(--text-bright)]">{percent.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateString: string | null) {
  if (!dateString) return ""
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateString))
  } catch {
    return dateString
  }
}
