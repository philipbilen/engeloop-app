"use client"

import { useState, useTransition } from "react"
import { Database } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { AddContributorModal } from "@/components/shared/add-contributor-modal"
import { addContributor, removeContributor } from "@/lib/actions/contributors"
import { useRouter } from "next/navigation"

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

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
            Contributors
          </h2>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)} disabled={isPending}>
            + Add Contributor
          </Button>
        </div>
        
        <div className="space-y-3">
          {contributors.length > 0 ? (
            contributors.map((contributor) => (
              <div
                key={contributor.id}
                className="p-4 flex justify-between items-center rounded"
                style={{
                  border: "2px solid var(--border-primary)",
                  backgroundColor: "var(--bg-main)",
                }}
              >
                <div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-bright)" }}
                  >
                    {contributor.artist_profiles?.artist_name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {contributor.role}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveContributor(contributor.id)}
                  disabled={isPending}
                >
                  {isPending ? "..." : "Remove"}
                </Button>
              </div>
            ))
          ) : (
            <p style={{ color: "var(--text-dimmer)" }}>
              No contributors added yet.
            </p>
          )}
        </div>
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