"use client"

import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get("q") || ""

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (term) {
      params.set("q", term)
    } else {
      params.delete("q")
    }

    // Preserve other params (status, sort)
    router.replace(`/releases?${params.toString()}`)
  }, 300)

  return (
    <div>
      <Input
        type="search"
        placeholder="Search by title, artist, catalog number..."
        defaultValue={currentQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full"
        style={{
          backgroundColor: "var(--bg-main)",
          borderColor: "var(--border-primary)",
          color: "var(--text-bright)",
        }}
      />
    </div>
  )
}
