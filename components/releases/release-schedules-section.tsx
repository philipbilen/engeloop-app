"use client"

import { useState, useTransition } from "react"
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

type Agreement = Database["public"]["Tables"]["contracts"]["Row"]
type Release = Database["public"]["Tables"]["releases"]["Row"]
type Contact = Database["public"]["Tables"]["contacts"]["Row"]

interface ReleaseSchedulesSectionProps {
  release: Release
  linkedSchedules: Agreement[]
  allSchedules: Agreement[]
  allContacts: Contact[]
}

export function ReleaseSchedulesSection({
  release,
  linkedSchedules: initialLinkedSchedules,
  allSchedules,
  allContacts,
}: ReleaseSchedulesSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [isLinkModalOpen, setLinkModalOpen] = useState(false)
  const [linkedSchedules, setLinkedSchedules] = useState(initialLinkedSchedules)

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

  return (
    <>
      <section>
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: "2px solid var(--border-primary)" }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Release Schedules
          </h2>
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
            <div className="text-center p-8" style={{ border: '2px dashed var(--border-primary)', color: 'var(--text-muted)'}}>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Schedules Linked</h3>
              <p>A Release Schedule defines the core deal terms for this release, such as royalty splits, term, and territory.</p>
              <p className="mt-4">You can either create a new schedule specifically for this release or link an existing one.</p>
            </div>
          )}
        </div>
      </section>

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
    </>
  )
}