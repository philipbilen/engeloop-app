"use client"

import { Database } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{schedule.contract_type}</CardTitle>
          <p className="text-sm font-mono text-[var(--text-muted)]">
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
      </CardHeader>
      <CardContent className="mt-2 grid grid-cols-2 gap-4 border-t-2 border-[var(--border-primary)] pt-4 md:grid-cols-4">
        <DetailItem 
          label="Label / Licensor Split" 
          value={`${schedule.label_share_percent}% / ${schedule.licensor_pool_percent}%`} 
        />
        <DetailItem label="Term" value={schedule.term || 'N/A'} />
        <DetailItem label="Territory" value={schedule.territory || 'N/A'} />
        <DetailItem label="Created" value={new Date(schedule.created_at).toLocaleDateString()} />
      </CardContent>
    </Card>
  )
}
