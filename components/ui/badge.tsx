import * as React from "react"
import { cn } from "@/lib/utils"

export type ReleaseStatus =
  | "planning"
  | "signed"
  | "in_progress"
  | "ready_for_delivery"
  | "delivered"
  | "released"
  | "archived"
  | "draft"
  | "sent"
  | "executed"

interface StatusBadgeProps {
  status: ReleaseStatus
  className?: string
}

const statusConfig: Record<ReleaseStatus, { label: string; style: React.CSSProperties }> = {
  planning: {
    label: "DRAFT",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--frost-cyan)',
      borderColor: 'var(--frost-cyan)',
    },
  },
  signed: {
    label: "SIGNED",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--frost-blue)',
      borderColor: 'var(--frost-blue)',
    },
  },
  in_progress: {
    label: "IN PROGRESS",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--aurora-yellow)',
      borderColor: 'var(--aurora-yellow)',
    },
  },
  ready_for_delivery: {
    label: "READY",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--aurora-green)',
      borderColor: 'var(--aurora-green)',
    },
  },
  delivered: {
    label: "DELIVERED",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--aurora-green)',
      borderColor: 'var(--aurora-green)',
    },
  },
  released: {
    label: "RELEASED",
    style: {
      backgroundColor: 'var(--aurora-green)',
      color: 'var(--nord0)',
      borderColor: 'var(--aurora-green)',
    },
  },
  archived: {
    label: "ARCHIVED",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--nord4)',
      borderColor: 'var(--nord4)',
    },
  },
  // Contract Statuses
  draft: {
    label: "DRAFT",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--frost-cyan)',
      borderColor: 'var(--frost-cyan)',
    },
  },
  sent: {
    label: "SENT",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--aurora-yellow)',
      borderColor: 'var(--aurora-yellow)',
    },
  },
  executed: {
    label: "EXECUTED",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--aurora-green)',
      borderColor: 'var(--aurora-green)',
    },
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status || "UNKNOWN",
    style: {
      backgroundColor: 'var(--nord3)',
      color: 'var(--nord4)',
      borderColor: 'var(--nord4)',
    },
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-wider border leading-none",
        className
      )}
      style={config.style}
    >
      {config.label}
    </span>
  )
}
