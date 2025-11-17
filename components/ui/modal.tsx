"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(18, 21, 28, 0.8)", // Darker overlay
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn("w-full m-4 flex flex-col rounded-lg", sizeClasses[size])}
        style={{
          backgroundColor: "var(--bg-main)",
          border: "2px solid var(--border-primary)",
          maxHeight: "90vh",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)", // Drop shadow for elevation
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5"
          style={{
            borderBottom: "2px solid var(--border-primary)",
          }}
        >
          <h2
            className="text-xl font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-bright)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: "var(--text-dimmer)" }}
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}