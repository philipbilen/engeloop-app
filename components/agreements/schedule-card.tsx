"use client"

import { Database } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"

type Agreement = Database["public"]["Tables"]["contracts"]["Row"]

interface ScheduleCardProps {
  schedule: Agreement
  onUnlink: (scheduleId: string) => void
  isPending: boolean
}

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div>
    <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
  </div>
)

export function ScheduleCard({ schedule, onUnlink, isPending }: ScheduleCardProps) {
  return (
    <div className="p-5 rounded" style={{ border: '2px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)'}}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {schedule.contract_type}
          </h3>
          <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            ID: {schedule.id}
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onUnlink(schedule.id)}
          disabled={isPending}
        >
          {isPending ? "..." : "Unlink"}
        </Button>
      </div>
      <div className="mt-4 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4" style={{ borderTop: '2px solid var(--border-primary)'}}>
        <DetailItem 
          label="Label / Licensor Split" 
          value={`${schedule.label_share_percent}% / ${schedule.licensor_pool_percent}%`} 
        />
        <DetailItem label="Term" value={schedule.term || 'N/A'} />
        <DetailItem label="Territory" value={schedule.territory || 'N/A'} />
        <DetailItem label="Created" value={new Date(schedule.created_at).toLocaleDateString()} />
      </div>
    </div>
  )
}
