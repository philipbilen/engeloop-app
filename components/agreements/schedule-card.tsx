"use client";

import { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Agreement = Database["public"]["Tables"]["contracts"]["Row"];
type TermType = Agreement["term_type"];

interface ScheduleCardProps {
  schedule: Agreement;
  onUnlink: (scheduleId: string) => void;
  isPending: boolean;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <p className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
      {label}
    </p>
    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
      {value}
    </p>
  </div>
);

export function ScheduleCard({
  schedule,
  onUnlink,
  isPending,
}: ScheduleCardProps) {
  const termDisplay = buildTermDisplay({
    term_type: schedule.term_type,
    term_value_years: schedule.term_value_years,
    auto_renew_interval_years: schedule.auto_renew_interval_years,
  });

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
        <DetailItem label="Term" value={termDisplay} />
        <DetailItem label="Territory" value={schedule.territory || "N/A"} />
        <DetailItem
          label="Created"
          value={schedule.created_at ? new Date(schedule.created_at).toLocaleDateString() : "—"}
        />
      </CardContent>
    </Card>
  );
}

function buildTermDisplay({
  term_type,
  term_value_years,
  auto_renew_interval_years,
}: {
  term_type: TermType;
  term_value_years: Agreement["term_value_years"];
  auto_renew_interval_years: Agreement["auto_renew_interval_years"];
}) {
  switch (term_type) {
    case "perpetual":
      return "Perpetual";
    case "fixed":
      return term_value_years ? `${term_value_years} Years` : "Fixed term";
    case "auto_renew":
      return auto_renew_interval_years
        ? `Auto-renews every ${auto_renew_interval_years} yrs`
        : "Auto-renew";
    case "evergreen_with_notice":
      return "Evergreen (notice required)";
    default:
      return "N/A";
  }
}
