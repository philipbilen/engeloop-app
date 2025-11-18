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

interface StatusBadgeProps {
  status: ReleaseStatus
  className?: string
}

const statusConfig: Record<ReleaseStatus, { label: string; style: React.CSSProperties }> = {
  planning: {
    label: "DRAFT",
    style: {
      backgroundColor: 'rgba(44, 50, 64, 0.75)',
      color: 'var(--text-dim)',
      borderColor: 'var(--border-primary)',
    },
  },
  signed: {
    label: "SIGNED",
    style: {
      backgroundColor: 'rgba(var(--accent-primary-rgb), 0.12)',
      color: 'var(--accent-primary)',
      borderColor: 'rgba(var(--accent-primary-rgb), 0.5)',
    },
  },
  in_progress: {
    label: "IN PROGRESS",
    style: {
      backgroundColor: 'rgba(var(--accent-warning-rgb), 0.15)',
      color: 'var(--accent-warning)',
      borderColor: 'rgba(var(--accent-warning-rgb), 0.5)',
    },
  },
  ready_for_delivery: {
    label: "READY FOR DELIVERY",
    style: {
      backgroundColor: 'rgba(var(--accent-success-rgb), 0.12)',
      color: 'var(--accent-success)',
      borderColor: 'rgba(var(--accent-success-rgb), 0.55)',
    },
  },
  delivered: {
    label: "DELIVERED",
    style: {
      backgroundColor: 'rgba(var(--accent-success-rgb), 0.14)',
      color: 'var(--accent-success)',
      borderColor: 'rgba(var(--accent-success-rgb), 0.6)',
    },
  },
  released: {
    label: "RELEASED",
    style: {
      backgroundColor: 'rgba(var(--accent-success-rgb), 0.16)',
      color: 'var(--accent-success)',
      borderColor: 'rgba(var(--accent-success-rgb), 0.65)',
    },
  },
  archived: {
    label: "ARCHIVED",
    style: {
      backgroundColor: 'rgba(44, 50, 64, 0.55)',
      color: 'var(--text-dimmer)',
      borderColor: 'var(--border-primary)',
    },
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide border-2 rounded-full leading-none",
        className
      )}
      style={config.style}
    >
      {config.label}
    </span>
  )
}
