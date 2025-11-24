"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Database } from "@/lib/supabase/types"

type Agreement = Database["public"]["Tables"]["contracts"]["Row"]

interface LinkScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  schedules: Agreement[]
  onLink: (selectedScheduleIds: string[]) => void
  isLinking: boolean
}

export function LinkScheduleModal({
  isOpen,
  onClose,
  schedules,
  onLink,
  isLinking,
}: LinkScheduleModalProps) {
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])

  const handleToggleSchedule = (scheduleId: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId]
    )
  }

  const handleLinkClick = () => {
    onLink(selectedScheduleIds)
    setSelectedScheduleIds([])
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link Existing Release Schedules" size="md">
      <div className="p-5" style={{ borderBottom: "2px solid var(--border-primary)" }}>
        {schedules.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => handleToggleSchedule(schedule.id)}
                className="p-3 flex items-center justify-between cursor-pointer"
                style={{
                  border: "2px solid var(--border-primary)",
                  backgroundColor: selectedScheduleIds.includes(schedule.id)
                    ? "var(--bg-tertiary)"
                    : "var(--bg-secondary)",
                }}
              >
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {schedule.contract_type} - {schedule.created_at ? new Date(schedule.created_at).toLocaleDateString() : "No Date"}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    ID: {schedule.id}
                  </p>
                </div>
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedScheduleIds.includes(schedule.id)}
                  className="h-5 w-5"
                  style={{
                    accentColor: "var(--accent-primary)",
                    backgroundColor: "var(--bg-primary)",
                    border: "2px solid var(--border-primary)",
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>
            No available schedules to link.
          </p>
        )}
      </div>
      <div className="p-5 flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isLinking}>
          CANCEL
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleLinkClick}
          disabled={isLinking || selectedScheduleIds.length === 0}
        >
          {isLinking ? "LINKING..." : `LINK ${selectedScheduleIds.length} SCHEDULE(S)`}
        </Button>
      </div>
    </Modal>
  )
}
