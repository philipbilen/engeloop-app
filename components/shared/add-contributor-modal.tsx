"use client"

import { useState, useTransition, useEffect } from "react" // Removed useMemo as it's no longer used
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Database } from "@/lib/supabase/types"
import { createArtistProfile, searchArtists } from "@/lib/actions/artists"

type ArtistProfile = Database["public"]["Tables"]["artist_profiles"]["Row"]
type CreditRole = Database["public"]["Enums"]["credit_role"]

const creditRoles: CreditRole[] = [
    'Producer', 'Composer', 'Remixer', 'Featured Artist', 'Manager', 
    'Engineer (Mix)', 'Engineer (Master)', 'Engineer (Mix & Master)', 'Other'
]

interface AddContributorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (artistProfileId: string, role: CreditRole) => void
  existingContributors: { artist_profiles: ArtistProfile | null, role: CreditRole }[]
}

export function AddContributorModal({
  isOpen,
  onClose,
  onAdd,
  existingContributors,
}: AddContributorModalProps) {
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<CreditRole | "">("")
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

  // availableArtists now just reflects search results, no longer filters out existing
  // The disabling logic is moved to the individual artist buttons
  const artistsToDisplay = searchResults

  const handleSelectAndAdd = (artist: ArtistProfile) => {
    if (!selectedRole) {
      alert("Please select a role first.")
      return
    }
    onAdd(artist.id, selectedRole)
    handleClose()
  }
  
  const handleCreateNew = () => {
    if (!searchQuery.trim()) {
      alert("Please enter an artist name to create.")
      return
    }
    if (!selectedRole) {
      alert("Please select a role first.")
      return
    }
    startTransition(async () => {
      const newArtist = await createArtistProfile(searchQuery.trim())
      if (newArtist) {
        onAdd(newArtist.id, selectedRole)
        handleClose()
      }
    })
  }

  const handleClose = () => {
    setSearchQuery("")
    setSelectedRole("")
    setSearchResults([])
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Contributor">
      <div className="p-5 space-y-4" style={{ borderBottom: "2px solid var(--border-primary)" }}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4" style={{ transform: "translateY(-50%)", color: "var(--text-dimmer)" }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search to add or create an artist"
            autoFocus
            className="w-full pl-10 pr-4 py-2"
          />
        </div>
        <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as CreditRole)}>
          <option value="" disabled>Select a role</option>
          {creditRoles.map(role => <option key={role} value={role}>{role}</option>)}
        </Select>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
        {isSearching && searchQuery.trim() ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-dimmer)' }}>Searching...</div>
        ) : artistsToDisplay.length > 0 ? (
          artistsToDisplay.map((artist) => {
            const isAlreadyAddedWithRole = existingContributors.some(
              (c) => c.artist_profiles?.id === artist.id && c.role === selectedRole
            )
            return (
              <button
                key={artist.id}
                onClick={() => handleSelectAndAdd(artist)}
                disabled={!selectedRole || isAlreadyAddedWithRole}
                className="w-full px-5 py-3 text-left transition-colors hover:bg-interactive disabled:opacity-50"
                style={{ borderBottom: "2px solid var(--border-primary)", backgroundColor: "var(--bg-main)" }}
              >
                <p className="font-medium" style={{ color: "var(--text-bright)" }}>{artist.artist_name}</p>
                {artist.full_legal_name && <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>{artist.full_legal_name}</p>}
              </button>
            )
          })
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-dimmer)" }}>
              {searchQuery.trim() ? `No artists found matching "${searchQuery}"` : "Type to search for an artist"}
            </p>
          </div>
        )}
      </div>

      <div className="p-5 flex gap-2 justify-end" style={{ borderTop: "2px solid var(--border-primary)" }}>
        <Button variant="ghost" onClick={handleClose}>CANCEL</Button>
        <Button
          variant="primary"
          onClick={handleCreateNew}
          disabled={isPending || !searchQuery.trim() || !selectedRole}
        >
          {isPending ? "CREATING..." : `+ CREATE "${searchQuery.trim()}"`}
        </Button>
      </div>
    </Modal>
  )
}
