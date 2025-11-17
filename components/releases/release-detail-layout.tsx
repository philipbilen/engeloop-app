"use client"

import { Database } from "@/lib/supabase/types"
import { ReleaseMetadataSection } from "./release-metadata-section"
import { ReleaseMainArtistsSection } from "./release-main-artists-section"
import { ReleaseTracksSection } from "./release-tracks-section"
import { ReleaseSchedulesSection } from "./release-schedules-section"
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs"
import { ReleaseContributorsSection } from "./release-contributors-section"
import { FinancialsSection } from "./financials-section"

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
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside className="w-80 p-6 flex flex-col gap-6" style={{
        backgroundColor: 'var(--bg-main)',
        borderRight: '2px solid var(--border-primary)'
      }}>
        {/* Catalog Number */}
        <div className="p-4 rounded" style={{
          border: '2px solid var(--border-primary)',
          backgroundColor: 'var(--bg-interactive)'
        }}>
          <p className="text-xs uppercase mb-2 font-semibold" style={{ color: 'var(--text-dimmer)' }}>
            CATALOG NUMBER
          </p>
          <p className="font-mono text-2xl font-semibold" style={{ color: 'var(--accent-primary)' }}>
            {release.internal_catalog_id}
          </p>
        </div>

        {/* Status Badge */}
        <div className="p-4 rounded" style={{
          border: '2px solid var(--border-primary)',
          backgroundColor: 'var(--bg-interactive)'
        }}>
          <p className="text-xs uppercase mb-3 font-semibold" style={{ color: 'var(--text-dimmer)' }}>
            STATUS
          </p>
          <div
            className="w-full px-4 py-3 text-center text-sm uppercase font-bold tracking-wider rounded"
            style={getStatusStyle(release.status)}
          >
            {release.status.replace('_', ' ')}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 rounded" style={{
          border: '2px solid var(--border-primary)',
          backgroundColor: 'var(--bg-interactive)'
        }}>
          <p className="text-xs uppercase mb-3 font-semibold" style={{ color: 'var(--text-dimmer)' }}>
            QUICK ACTIONS
          </p>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 font-medium uppercase tracking-wide text-sm transition-colors rounded" style={{
              backgroundColor: 'transparent',
              color: 'var(--accent-primary)',
              border: '2px solid var(--accent-primary)'
            }}>
              CLONE AS VARIANT
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <a href="/releases" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>
            Releases
          </a>
          <span className="mx-2" style={{ color: 'var(--text-dimmer)' }}>&gt;</span>
          <span className="font-mono" style={{ color: 'var(--text-bright)' }}>
            {release.internal_catalog_id}
          </span>
          <span className="mx-2" style={{ color: 'var(--text-dimmer)' }}>&gt;</span>
          <span style={{ color: 'var(--text-dimmer)' }}>Edit</span>
        </nav>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>
            {release.title}
            {release.version && (
              <span className="ml-2 text-3xl font-medium" style={{ color: 'var(--text-dim)' }}>
                ({release.version})
              </span>
            )}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-dim)' }}>
            {mainArtists.map(a => a.artist_name).join(" & ") || "No artists"}
          </p>
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

          <div className="mt-6 p-8 rounded" style={{ backgroundColor: 'var(--bg-interactive)' }}>
            <TabPanel label="core-info">
              <ReleaseMetadataSection release={release} />
            </TabPanel>

            <TabPanel label="artists-credits">
              <div className="space-y-8">
                <ReleaseMainArtistsSection
                  releaseId={release.id}
                  initialArtists={mainArtists}
                />
                <ReleaseContributorsSection
                  releaseId={release.id}
                  initialContributors={contributors}
                  allArtists={allArtists}
                />
              </div>
            </TabPanel>

            <TabPanel label="tracks">
              <ReleaseTracksSection
                releaseId={release.id}
                initialTracks={release.tracks || []}
              />
            </TabPanel>

            <TabPanel label="schedules">
              <ReleaseSchedulesSection
                release={release}
                linkedSchedules={linkedSchedules}
                allSchedules={allSchedules}
                allContacts={allContacts}
              />
            </TabPanel>
            
            <TabPanel label="financials">
              <FinancialsSection
                release={release}
                linkedSchedules={linkedSchedules}
                allContacts={allContacts}
              />
            </TabPanel>
          </div>
        </Tabs>
      </main>
    </div>
  )
}

function getStatusStyle(status: string) {
  const styles = {
    planning: {
      border: '2px solid var(--text-dimmer)',
      backgroundColor: 'transparent',
      color: 'var(--text-dimmer)'
    },
    signed: {
      border: '2px solid var(--accent-primary)',
      backgroundColor: 'rgba(0, 224, 255, 0.1)',
      color: 'var(--accent-primary)'
    },
    in_progress: {
      border: '2px solid var(--accent-warning)',
      backgroundColor: 'rgba(235, 203, 139, 0.1)',
      color: 'var(--accent-warning)'
    },
    delivered: {
      border: '2px solid var(--accent-success)',
      backgroundColor: 'rgba(163, 190, 140, 0.1)',
      color: 'var(--accent-success)'
    },
    released: {
      border: '2px solid var(--accent-success)',
      backgroundColor: 'rgba(163, 190, 140, 0.1)',
      color: 'var(--accent-success)'
    },
    archived: {
      border: '2px solid var(--accent-danger)',
      backgroundColor: 'rgba(191, 97, 106, 0.1)',
      color: 'var(--accent-danger)'
    },
  }
  return styles[status as keyof typeof styles] || {
    border: '2px solid var(--border-primary)',
    backgroundColor: 'transparent',
    color: 'var(--text-dimmer)'
  }
}