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

const statusConfig: Record<ReleaseStatus, { label: string; className: string }> = {
  planning: {
    label: "DRAFT",
    className: "bg-gray-600/20 text-gray-400 border-gray-600",
  },
  signed: {
    label: "SIGNED",
    className: "bg-blue-600/20 text-blue-400 border-blue-600",
  },
  in_progress: {
    label: "IN PROGRESS",
    className: "bg-yellow-600/20 text-yellow-400 border-yellow-600",
  },
  ready_for_delivery: {
    label: "READY FOR DELIVERY",
    className: "bg-teal-600/20 text-teal-400 border-teal-600",
  },
  delivered: {
    label: "DELIVERED",
    className: "bg-purple-600/20 text-purple-400 border-purple-600",
  },
  released: {
    label: "RELEASED",
    className: "bg-green-600/20 text-green-400 border-green-600",
  },
  archived: {
    label: "ARCHIVED",
    className: "bg-gray-700/20 text-gray-500 border-gray-700",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide border-2 rounded",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
