"use client"

import { Input } from "@/components/ui/input"

interface SearchBarProps {
  value: string
  onChange: (term: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div>
      <Input
        type="search"
        placeholder="Search by title, artist, catalog number..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] text-[var(--text-bright)]"
      />
    </div>
  )
}
