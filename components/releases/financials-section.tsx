"use client"

import { useState, useEffect, useTransition } from "react"
import { Database } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { SplitsManagementModal } from "@/components/shared/splits-management-modal"
import { getSharesByTrack } from "@/lib/actions/shares"

type Release = Database["public"]["Tables"]["releases"]["Row"] & { tracks: Database["public"]["Tables"]["tracks"]["Row"][] }
type Agreement = Database["public"]["Tables"]["contracts"]["Row"]
type Contact = Database["public"]["Tables"]["contacts"]["Row"]
type Share = Awaited<ReturnType<typeof getSharesByTrack>>[0]

interface FinancialsSectionProps {
  release: Release
  linkedSchedules: Agreement[]
  allContacts: Contact[]
}

export function FinancialsSection({
  release,
  linkedSchedules,
  allContacts,
}: FinancialsSectionProps) {
  const [selectedTrack, setSelectedTrack] = useState<Database["public"]["Tables"]["tracks"]["Row"] | null>(null)
  const [trackShares, setTrackShares] = useState<Share[]>([])
  const [isSharesLoading, startSharesTransition] = useTransition() // Use useTransition for loading state

  const primarySchedule = linkedSchedules[0]
  const licensorPoolPercent = primarySchedule?.licensor_pool_percent ?? 0

  useEffect(() => {
    if (selectedTrack) {
      startSharesTransition(async () => { // Wrap async call in startTransition
        try {
          const shares = await getSharesByTrack(selectedTrack.id)
          setTrackShares(shares)
        } catch (error) {
          console.error("Failed to load track shares:", error)
          setTrackShares([])
        }
      })
    }
  }, [selectedTrack])

  const handleManageSplits = (track: Database["public"]["Tables"]["tracks"]["Row"]) => {
    setSelectedTrack(track)
  }

  const closeModal = () => {
    setSelectedTrack(null)
    setTrackShares([])
  }

  if (linkedSchedules.length === 0) {
    return (
      <section className="p-6 text-center rounded" style={{ border: "2px dashed var(--border-primary)", color: 'var(--text-dimmer)'}}>
        <p>A Release Schedule must be linked before managing financial splits.</p>
        <p className="text-sm mt-2">Please go to the &quot;Release Schedules&quot; tab to link or create a schedule.</p>
      </section>
    )
  }

  return (
    <>
      <section>
        <div className="p-5" style={{ borderBottom: "2px solid var(--border-primary)" }}>
          <h2 className="text-base font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
            Track-Level Splits
          </h2>
          <p className="text-sm" style={{ color: "var(--text-dimmer)" }}>
            Based on a <span style={{ color: 'var(--accent-primary)'}}>{licensorPoolPercent}%</span> licensor pool from the primary linked schedule.
          </p>
        </div>
        <div className="p-5">
          <ul className="space-y-3">
            {release.tracks.map((track) => (
              <li
                key={track.id}
                className="p-4 flex justify-between items-center rounded"
                style={{
                  border: "2px solid var(--border-primary)",
                  backgroundColor: "var(--bg-main)",
                }}
              >
                <div>
                  <p className="font-medium" style={{ color: "var(--text-bright)" }}>
                    {track.title}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                    {/* TODO: Display summary of splits */}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleManageSplits(track)}
                >
                  Manage Splits
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {selectedTrack && (
        isSharesLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(18, 21, 28, 0.8)" }}>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>Loading Shares...</p>
          </div>
        ) : (
          <SplitsManagementModal
            isOpen={!!selectedTrack}
            onClose={closeModal}
            track={selectedTrack}
            initialShares={trackShares}
            allContacts={allContacts}
            licensorPoolPercent={licensorPoolPercent}
          />
        )
      )}
    </>
  )
}
