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
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      color: '#312E81',
      borderColor: 'rgba(99, 102, 241, 0.35)',
    },
  },
  signed: {
    label: "SIGNED",
    style: {
      backgroundColor: 'rgba(var(--accent-primary-rgb), 0.12)',
      color: 'var(--accent-primary)',
      borderColor: 'rgba(var(--accent-primary-rgb), 0.45)',
    },
  },
  in_progress: {
    label: "IN PROGRESS",
    style: {
      backgroundColor: 'rgba(var(--accent-warning-rgb), 0.12)',
      color: '#B45309',
      borderColor: 'rgba(var(--accent-warning-rgb), 0.4)',
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
      backgroundColor: 'rgba(var(--accent-success-rgb), 0.12)',
      color: '#166534',
      borderColor: 'rgba(var(--accent-success-rgb), 0.5)',
    },
  },
  released: {
    label: "RELEASED",
    style: {
      backgroundColor: 'rgba(var(--accent-success-rgb), 0.16)',
      color: '#166534',
      borderColor: 'rgba(var(--accent-success-rgb), 0.5)',
    },
  },
  archived: {
    label: "ARCHIVED",
    style: {
      backgroundColor: '#F3F4F6',
      color: '#4B5563',
      borderColor: '#E5E7EB',
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
