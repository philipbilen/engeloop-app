"use client"

import { Database } from "@/lib/supabase/types"
import { ReleaseMetadataSection } from "./release-metadata-section"
import { ReleaseMainArtistsSection } from "./release-main-artists-section"
import { ReleaseTracksSection } from "./release-tracks-section"
import { ReleaseSchedulesSection } from "./release-schedules-section"
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs"
import { ReleaseContributorsSection } from "./release-contributors-section"
import { FinancialsSection } from "./financials-section"
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
  allArtists: ArtistProfile[]
}

export function ReleaseDetailLayout({
  release,
  mainArtists,
  linkedSchedules,
  allSchedules,
  allContacts,
  contributors,
  allArtists,
}: ReleaseDetailLayoutProps) {
  return (
    <main className="max-w-6xl mx-auto px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm flex items-center gap-2 text-[var(--text-dimmer)]">
        <a href="/releases" className="hover:underline text-[var(--accent-primary)]">
          Releases
        </a>
        <span>&gt;</span>
        <span className="font-mono text-[var(--text-bright)]">{release.internal_catalog_id}</span>
        <span>&gt;</span>
        <span>Edit</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--text-bright)]">
            {release.title}
            {release.version && (
              <span className="ml-2 text-3xl font-medium text-[var(--text-dim)]">
                ({release.version})
              </span>
            )}
          </h1>
          <p className="text-lg text-[var(--text-dim)]">
            {mainArtists.map(a => a.artist_name).join(" & ") || "No artists"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full border text-sm font-mono text-[var(--text-bright)] border-[var(--border-primary)]">
            {release.internal_catalog_id}
          </span>
          <StatusBadge status={release.status as ReleaseStatus} />
          <Button variant="ghost" size="icon" aria-label="More actions">
            ⋯
          </Button>
          <Button variant="secondary" size="sm">
            Clone as Variant
          </Button>
        </div>
      </div>

      {/* Tabbed Sections */}
      <Tabs defaultTab="core-info">
        <TabList>
          <Tab label="core-info">Core Info</Tab>
          <Tab label="artists-credits">Artists & Credits</Tab>
          <Tab label="tracks">Tracks</Tab>
          <Tab label="schedules">Release Schedules</Tab>
          <Tab label="financials">Financials</Tab>
        </TabList>

        <div className="mt-6">
          <TabPanel label="core-info">
            <Card padding="lg">
              <ReleaseMetadataSection release={release} />
            </Card>
          </TabPanel>

          <TabPanel label="artists-credits">
            <div className="space-y-6">
              <Card padding="lg">
                <ReleaseMainArtistsSection
                  releaseId={release.id}
                  initialArtists={mainArtists}
                />
              </Card>
              <Card padding="lg">
                <ReleaseContributorsSection
                  releaseId={release.id}
                  initialContributors={contributors}
                />
              </Card>
            </div>
          </TabPanel>

          <TabPanel label="tracks">
            <Card padding="lg">
              <ReleaseTracksSection
                releaseId={release.id}
                initialTracks={release.tracks || []}
              />
            </Card>
          </TabPanel>

          <TabPanel label="schedules">
            <Card padding="lg">
              <ReleaseSchedulesSection
                release={release}
                linkedSchedules={linkedSchedules}
                allSchedules={allSchedules}
                allContacts={allContacts}
              />
            </Card>
          </TabPanel>
          
          <TabPanel label="financials">
            <Card padding="lg">
              <FinancialsSection
                release={release}
                linkedSchedules={linkedSchedules}
                allContacts={allContacts}
              />
            </Card>
          </TabPanel>
        </div>
      </Tabs>
    </main>
  )
}
