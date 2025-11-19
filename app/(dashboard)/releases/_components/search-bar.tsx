"use client"

import { Input } from "@/components/ui/input"

interface SearchBarProps {
  value: string
  onChange: (term: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dimmer)]"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m16.5 16.5 4 4" />
      </svg>
      <Input
        type="search"
        placeholder="Search by title, artist, catalog number..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border-[var(--border-primary)] text-[var(--text-bright)] pl-9"
      />
    </div>
  )
}
