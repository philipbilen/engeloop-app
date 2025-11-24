"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pencil, Music, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ArtistDetail {
  id: string
  artist_name: string
  spotify_url: string | null
  apple_music_url: string | null
  updated_at: string | null
}

interface ArtistSummaryPanelProps {
  activeArtistId: string | null
  selectedDetail: ArtistDetail | null
  totalCount: number
}

export function ArtistSummaryPanel({ activeArtistId, selectedDetail, totalCount }: ArtistSummaryPanelProps) {
  if (selectedDetail && activeArtistId === selectedDetail.id) {
    return <ArtistDetailView detail={selectedDetail} />
  }

  return (
    <div className="h-full border-l border-[var(--border-primary)] bg-[var(--nord1)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dimmer)]">Context</p>
          <h3 className="text-lg font-semibold text-[var(--text-bright)]">Summary</h3>
        </div>
        <span className="rounded-full bg-[var(--bg-interactive)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
          {totalCount} Artists
        </span>
      </div>

      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 text-center">
        <p className="text-sm text-[var(--text-dimmer)]">
          Select an artist to view their profile and DSP links.
        </p>
      </div>
    </div>
  )
}

function ArtistDetailView({ detail }: { detail: ArtistDetail }) {
  return (
    <div className="h-full flex flex-col border-l border-[var(--border-primary)] bg-[var(--nord1)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* === HEADER === */}
          <div className="px-4 py-4 border-b border-[var(--border-primary)] bg-[var(--nord1)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h2 className="text-xl font-bold text-[var(--text-bright)] leading-tight font-sans">
                  {detail.artist_name}
                </h2>
                <p className="text-xs text-[var(--text-dimmer)] uppercase tracking-wide flex items-center gap-1">
                  <Music className="w-3 h-3" />
                  Artist Profile
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/artists">
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

          {/* === SECTION 1: DSP LINKS === */}
          <StructuralSection title="DSP PROFILES">
            <div className="space-y-1">
              <DataField 
                label="SPOTIFY" 
                value={detail.spotify_url || "—"} 
                isLink={!!detail.spotify_url}
              />
              <DataField 
                label="APPLE MUSIC" 
                value={detail.apple_music_url || "—"} 
                isLink={!!detail.apple_music_url}
              />
            </div>
          </StructuralSection>

          {/* === SECTION 2: METADATA === */}
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

function DataField({ label, value, mono = false, isLink = false }: { label: string; value: string; mono?: boolean; isLink?: boolean }) {
  return (
    <div className="flex items-center justify-between border border-[var(--border-primary)] px-2 py-1.5 gap-3">
      <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-dimmer)]">
        {label}
      </span>
      {isLink ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-medium text-right flex-shrink-0 text-[var(--frost-blue)] hover:text-[var(--frost-cyan)] flex items-center gap-1 truncate max-w-[200px]"
        >
          Open <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className={cn(
          "text-xs font-medium text-right flex-shrink-0 text-[var(--text-bright)] truncate max-w-[200px]",
          mono && "font-mono"
        )}>
          {value}
        </span>
      )}
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
