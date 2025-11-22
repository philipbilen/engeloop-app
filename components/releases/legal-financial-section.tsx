"use client"

import { useState, useEffect, useTransition } from "react"
import { Database } from "@/lib/supabase/types"
import { ReleaseScheduleFormModal } from "@/components/agreements/release-schedule-form-modal"
import { LinkScheduleModal } from "@/components/agreements/link-schedule-modal"
import { Button } from "@/components/ui/button"
import {
    linkAgreementToRelease,
    unlinkAgreementFromRelease,
} from "@/lib/actions/agreements"
import { useRouter } from "next/navigation"
import { ScheduleCard } from "@/components/agreements/schedule-card"
import { SplitsManagementModal } from "@/components/shared/splits-management-modal"
import { getSharesByTrack } from "@/lib/actions/shares"

type Agreement = Database["public"]["Tables"]["contracts"]["Row"]
type Release = Database["public"]["Tables"]["releases"]["Row"]
type Contact = Database["public"]["Tables"]["contacts"]["Row"]
type Track = Database["public"]["Tables"]["tracks"]["Row"]
type Share = Awaited<ReturnType<typeof getSharesByTrack>>[0]

interface LegalFinancialSectionProps {
    release: Release
    tracks: Track[]
    linkedSchedules: Agreement[]
    allSchedules: Agreement[]
    allContacts: Contact[]
}

export function LegalFinancialSection({
    release,
    tracks,
    linkedSchedules: initialLinkedSchedules,
    allSchedules,
    allContacts,
}: LegalFinancialSectionProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isSharesLoading, startSharesTransition] = useTransition()

    // Schedule State
    const [isScheduleModalOpen, setScheduleModalOpen] = useState(false)
    const [isLinkModalOpen, setLinkModalOpen] = useState(false)
    const [linkedSchedules, setLinkedSchedules] = useState(initialLinkedSchedules)

    // Financials State
    const [selectedTrack, setSelectedTrack] = useState<Database["public"]["Tables"]["tracks"]["Row"] | null>(null)
    const [trackShares, setTrackShares] = useState<Share[]>([])

    const primarySchedule = linkedSchedules[0]
    const licensorPoolPercent = primarySchedule?.licensor_pool_percent ?? 0

    // --- Schedule Handlers ---

    const handleCreateScheduleSuccess = (newSchedule: Agreement) => {
        startTransition(async () => {
            await linkAgreementToRelease(newSchedule.id, release.id)
            setLinkedSchedules([...linkedSchedules, newSchedule])
            router.refresh()
        })
    }

    const handleLinkSchedules = (schedulesToLink: string[]) => {
        startTransition(async () => {
            await Promise.all(
                schedulesToLink.map((scheduleId) =>
                    linkAgreementToRelease(scheduleId, release.id)
                )
            )
            router.refresh()
        })
    }

    const handleUnlinkSchedule = (scheduleId: string) => {
        startTransition(async () => {
            await unlinkAgreementFromRelease(scheduleId, release.id)
            setLinkedSchedules(linkedSchedules.filter((s) => s.id !== scheduleId))
            router.refresh()
        })
    }

    const availableSchedulesToLink = allSchedules.filter(
        (s) => !linkedSchedules.some((ls) => ls.id === s.id)
    )

    // --- Financials Handlers ---

    useEffect(() => {
        if (selectedTrack) {
            startSharesTransition(async () => {
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

    return (
        <div className="space-y-8">
            {/* --- SECTION 1: CONTRACTS (Source of Truth) --- */}
            <section>
                <div
                    className="flex items-center justify-between p-5"
                    style={{ borderBottom: "2px solid var(--border-primary)" }}
                >
                    <div>
                        <h2
                            className="text-xl font-semibold"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Release Schedule (Legal Source)
                        </h2>
                        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
                            The contract that defines the financial terms for this release.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setLinkModalOpen(true)}
                            disabled={isPending || availableSchedulesToLink.length === 0}
                        >
                            Link Existing
                        </Button>
                        <Button variant="primary" onClick={() => setScheduleModalOpen(true)} disabled={isPending}>
                            + Create New
                        </Button>
                    </div>
                </div>
                <div className="p-5">
                    {linkedSchedules.length > 0 ? (
                        <div className="space-y-4">
                            {linkedSchedules.map((schedule) => (
                                <ScheduleCard
                                    key={schedule.id}
                                    schedule={schedule}
                                    onUnlink={handleUnlinkSchedule}
                                    isPending={isPending}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8" style={{ border: '2px dashed var(--border-primary)', color: 'var(--text-muted)' }}>
                            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Schedule Linked</h3>
                            <p>Link a contract to define the licensor pool and enable split management.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- SECTION 2: FINANCIAL SPLITS (Dependent) --- */}
            <section className={`transition-opacity duration-200 ${linkedSchedules.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="p-5" style={{ borderBottom: "2px solid var(--border-primary)" }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                                Track-Level Split Allocation
                            </h2>
                            <p className="text-sm mt-1" style={{ color: "var(--text-dimmer)" }}>
                                Allocating the <span className="font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>{licensorPoolPercent}%</span> Licensor Pool defined above.
                            </p>
                        </div>
                        {/* TODO: Add validation status badge here (e.g. "All Valid" or "2 Invalid") */}
                    </div>
                </div>

                <div className="p-5">
                    {linkedSchedules.length === 0 ? (
                        <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-center">
                            <p className="text-[var(--text-dim)]">Link a schedule above to manage financial splits.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {tracks.map((track) => (
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
                                        <p className="text-sm font-mono text-[var(--text-dim)] mt-1">
                                            ISRC: {track.isrc || "Pending"}
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
                    )}
                </div>
            </section>

            {/* --- MODALS --- */}
            <ReleaseScheduleFormModal
                isOpen={isScheduleModalOpen}
                onClose={() => setScheduleModalOpen(false)}
                onSuccess={handleCreateScheduleSuccess}
                allContacts={allContacts}
            />

            <LinkScheduleModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                schedules={availableSchedulesToLink}
                onLink={handleLinkSchedules}
                isLinking={isPending}
            />

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
        </div>
    )
}
