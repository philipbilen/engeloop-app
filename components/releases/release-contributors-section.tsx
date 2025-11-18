"use client"

import { useState, useTransition } from "react"
import { Database } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { AddContributorModal } from "@/components/shared/add-contributor-modal"
import { addContributor, removeContributor } from "@/lib/actions/contributors"
import { useRouter } from "next/navigation"
import { fanOutTrackContributors, removeInheritedTrackContributors } from "@/lib/actions/track-links"

type Contributor = Awaited<ReturnType<typeof import("@/lib/actions/contributors").getContributorsByRelease>>[0]
// type ArtistProfile = Database["public"]["Tables"]["artist_profiles"]["Row"] // Removed unused import
type CreditRole = Database["public"]["Enums"]["credit_role"]

interface ReleaseContributorsSectionProps {
  releaseId: string
  initialContributors: Contributor[]
}

export function ReleaseContributorsSection({
  releaseId,
  initialContributors,
}: ReleaseContributorsSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [contributors, setContributors] = useState(initialContributors)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddContributor = (artistProfileId: string, role: CreditRole) => {
    startTransition(async () => {
      const newContributor = await addContributor(releaseId, artistProfileId, role)
      if (newContributor) {
        setContributors([...contributors, newContributor])
      }
      setIsModalOpen(false)
      router.refresh()
    })
  }

  const handleRemoveContributor = (contributorId: string) => {
    startTransition(async () => {
      await removeContributor(contributorId, releaseId)
      setContributors(contributors.filter(c => c.id !== contributorId))
      router.refresh()
    })
  }

  const handleApplyAllTracks = (artistProfileId: string, role: CreditRole, role_custom?: string | null) => {
    startTransition(async () => {
      await fanOutTrackContributors(releaseId, [{ artist_profile_id: artistProfileId, role, role_custom }])
      router.refresh()
    })
  }

  const handleRemoveInheritedFromTracks = (artistProfileId: string) => {
    startTransition(async () => {
      await removeInheritedTrackContributors(releaseId, [artistProfileId])
      router.refresh()
    })
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
            Contributors
          </h2>
        </div>
        
        <div className="divide-y divide-[var(--border-primary)] rounded-md border border-[var(--border-primary)] bg-[var(--bg-main)]">
          {contributors.length > 0 ? (
            contributors.map((contributor) => (
              <div
                key={contributor.id}
                className="px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-[var(--text-bright)]">
                    {contributor.artist_profiles?.artist_name}
                  </p>
                  <p className="text-sm text-[var(--text-dim)]">
                    {contributor.role_custom || contributor.role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleApplyAllTracks(contributor.artist_profile_id, contributor.role, contributor.role_custom || null)}
                    disabled={isPending}
                  >
                    Apply to Tracks
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInheritedFromTracks(contributor.artist_profile_id)}
                    disabled={isPending}
                  >
                    Remove from Tracks
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveContributor(contributor.id)}
                    disabled={isPending}
                  >
                    {isPending ? "..." : "Remove"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-3 text-[var(--text-dimmer)]">
              No contributors added yet.
            </p>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
          disabled={isPending}
          className="w-full"
        >
          + Add Contributor
        </Button>
      </section>

      <AddContributorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddContributor}
        existingContributors={contributors}
      />
    </>
  )
}
