"use client"

import { Database } from "@/lib/supabase/types"
import { ReleaseMetadataSection } from "./release-metadata-section"
import { ReleaseMainArtistsSection } from "./release-main-artists-section"
import { ReleaseTracksSection } from "./release-tracks-section"
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs"
import { ReleaseContributorsSection } from "./release-contributors-section"
import { LegalFinancialSection } from "./legal-financial-section"
import { StatusBadge, type ReleaseStatus } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Release = Database["public"]["Tables"]["releases"]["Row"]
type ArtistProfile = Database["public"]["Tables"]["artist_profiles"]["Row"]
type Track = Database["public"]["Tables"]["tracks"]["Row"]
type Agreement = Database["public"]["Tables"]["contracts"]["Row"]
type Contact = Database["public"]["Tables"]["contacts"]["Row"]
type Contributor = Awaited<ReturnType<typeof import("@/lib/actions/contributors").getContributorsByRelease>>[0]

interface ReleaseDetailLayoutProps {
  release: Release & { tracks?: Track[] }
  mainArtists: ArtistProfile[]
  linkedSchedules: Agreement[]
  allSchedules: Agreement[]
  allContacts: Contact[]
  contributors: Contributor[]
}

export function ReleaseDetailLayout({
  release,
  mainArtists,
  linkedSchedules,
  allSchedules,
  allContacts,
  contributors,
}: ReleaseDetailLayoutProps) {
  return (
    <main className="w-full p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6 border-b border-[var(--border-primary)] pb-6">
        <nav className="flex items-center gap-2 text-sm text-[var(--text-dimmer)]">
          <a href="/releases" className="hover:text-[var(--text-bright)] transition-colors">
            Releases
          </a>
          <span>/</span>
          <span className="font-mono text-[var(--text-dim)]">{release.internal_catalog_id}</span>
          <span>/</span>
          <span>Edit</span>
        </nav>

        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-baseline gap-4">
              <h1 className="text-2xl font-bold text-[var(--text-bright)] tracking-tight">
                {release.title}
              </h1>
              {release.version && (
                <span className="text-xl text-[var(--text-dim)]">
                  ({release.version})
                </span>
              )}
              <StatusBadge status={release.status as ReleaseStatus} className="ml-2" />
            </div>
            <p className="text-sm text-[var(--text-dim)]">
              {mainArtists.map(a => a.artist_name).join(" & ") || "No artists"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-sm border text-xs font-mono text-[var(--text-bright)] border-[var(--border-primary)] bg-[var(--bg-deep-dark)]">
              {release.internal_catalog_id}
            </span>
            <Button variant="ghost" size="icon" aria-label="More actions">
              ⋯
            </Button>
            <Button variant="secondary" size="sm">
              Clone as Variant
            </Button>
          </div>
        </div>
      </div>

      {/* Tabbed Sections */}
      <Tabs defaultTab="core-info">
        <TabList>
          <Tab label="core-info">Core Info</Tab>
          <Tab label="artists-credits">Artists & Credits</Tab>
          <Tab label="tracks">Tracks</Tab>
          <Tab label="legal-financial">Legal & Financial</Tab>
        </TabList>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] border-t-0 min-h-[500px]">
          <TabPanel label="core-info">
            <div className="p-6">
              <ReleaseMetadataSection release={release} />
            </div>
          </TabPanel>

          <TabPanel label="artists-credits">
            <div className="p-6 space-y-8">
              <ReleaseMainArtistsSection
                releaseId={release.id}
                initialArtists={mainArtists}
              />
              <ReleaseContributorsSection
                releaseId={release.id}
                initialContributors={contributors}
              />
            </div>
          </TabPanel>

          <TabPanel label="tracks">
            <div className="p-6">
              <ReleaseTracksSection
                releaseId={release.id}
                initialTracks={release.tracks || []}
              />
            </div>
          </TabPanel>

          <TabPanel label="legal-financial">
            <div className="p-6">
              <LegalFinancialSection
                release={release}
                tracks={release.tracks || []}
                linkedSchedules={linkedSchedules}
                allSchedules={allSchedules}
                allContacts={allContacts}
              />
            </div>
          </TabPanel>
        </div>
      </Tabs>
    </main>
  )
}
