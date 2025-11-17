"use client"

import { useState, useMemo, useTransition, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Database } from "@/lib/supabase/types"
import { createArtistProfile, searchArtists } from "@/lib/actions/artists"
import { Input } from "@/components/ui/input"

type ArtistProfile = Database["public"]["Tables"]["artist_profiles"]["Row"]

interface AddArtistModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (artist: ArtistProfile) => void
  excludeIds?: string[]
}

export function AddArtistModal({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: AddArtistModalProps) {
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ArtistProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounce search query
  useEffect(() => {
    if (!isOpen) return // Only search when modal is open

    const handler = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true)
        try {
          const results = await searchArtists(searchQuery.trim())
          setSearchResults(results)
        } catch (error) {
          console.error("Error searching artists:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300) // 300ms debounce

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, isOpen])

  const filteredArtists = useMemo(() => {
    return searchResults.filter(
      (artist) => !excludeIds.includes(artist.id)
    )
  }, [searchResults, excludeIds])

  const handleSelect = (artist: ArtistProfile) => {
    onSelect(artist)
    setSearchQuery("")
    setSearchResults([])
    onClose()
  }
  
  const handleCreateNew = () => {
    if (!searchQuery.trim()) {
      alert("Please enter an artist name to create.")
      return
    }
    startTransition(async () => {
      const newArtist = await createArtistProfile(searchQuery.trim())
      if (newArtist) {
        handleSelect(newArtist)
      }
    })
  }

  const handleCancel = () => {
    setSearchQuery("")
    setSearchResults([])
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Add Release Artist">
      {/* Search Input */}
      <div
        className="p-5"
        style={{
          borderBottom: "2px solid var(--border-primary)",
        }}
      >
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4"
            style={{
              transform: "translateY(-50%)",
              color: "var(--text-dimmer)",
            }}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search to add or create an artist"
            autoFocus
            className="w-full pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Artist List */}
      <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
        {isSearching && searchQuery.trim() ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-dimmer)' }}>Searching...</div>
        ) : filteredArtists.length > 0 ? (
          filteredArtists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => handleSelect(artist)}
              className="w-full px-5 py-3 text-left transition-colors hover:bg-interactive"
              style={{
                borderBottom: "2px solid var(--border-primary)",
                backgroundColor: "var(--bg-main)",
              }}
            >
              <p className="font-medium" style={{ color: "var(--text-bright)" }}>
                {artist.artist_name}
              </p>
              {artist.full_legal_name && (
                <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
                  {artist.full_legal_name}
                </p>
              )}
            </button>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-dimmer)" }}>
              {searchQuery.trim()
                ? `No artists found matching "${searchQuery}"`
                : "Type to search for an artist"}
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-5 flex gap-2 justify-end" style={{ borderTop: "2px solid var(--border-primary)" }}>
        <Button variant="ghost" onClick={handleCancel}>
          CANCEL
        </Button>
        <Button
          variant="primary"
          onClick={handleCreateNew}
          disabled={isPending || !searchQuery.trim()}
        >
          {isPending ? "CREATING..." : `+ CREATE "${searchQuery.trim()}"`}
        </Button>
      </div>
    </Modal>
  )
}
