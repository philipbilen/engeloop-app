"use client"

import { useState } from "react" // Removed useEffect as it's no longer used
import { Database } from "@/lib/supabase/types"
import { updateMainArtists } from "@/lib/actions/artists"
import { Button } from "@/components/ui/button"
import { AddArtistModal } from "@/components/shared/add-artist-modal"

type ArtistProfile = Database["public"]["Tables"]["artist_profiles"]["Row"]

interface ReleaseMainArtistsSectionProps {
  releaseId: string
  initialArtists: ArtistProfile[]
}

export function ReleaseMainArtistsSection({
  releaseId,
  initialArtists,
}: ReleaseMainArtistsSectionProps) {
  const [artists, setArtists] = useState<ArtistProfile[]>(initialArtists)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // No need for useEffect to fetch all artists anymore, as AddArtistModal handles its own search.

  const handleAddArtist = async (artist: ArtistProfile) => {
    const newArtists = [...artists, artist]
    setArtists(newArtists)
    await saveArtists(newArtists)
  }

  const handleRemoveArtist = async (artistId: string) => {
    const newArtists = artists.filter((a) => a.id !== artistId)
    setArtists(newArtists)
    await saveArtists(newArtists)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newArtists = [...artists]
    const draggedArtist = newArtists[draggedIndex]
    newArtists.splice(draggedIndex, 1)
    newArtists.splice(index, 0, draggedArtist)

    setArtists(newArtists)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      await saveArtists(artists)
    }
    setDraggedIndex(null)
  }

  const saveArtists = async (artistsList: ArtistProfile[]) => {
    setIsSaving(true)
    try {
      await updateMainArtists(
        releaseId,
        artistsList.map((a) => a.id)
      )
    } catch (error) {
      console.error("Failed to save artists:", error)
      alert("Failed to save artists")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <AddArtistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAddArtist}
        excludeIds={artists.map((a) => a.id)}
      />

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
            MAIN ARTISTS
          </h2>
          {isSaving && (
            <span className="text-sm" style={{ color: "var(--text-dimmer)" }}>
              Saving...
            </span>
          )}
        </div>

        {/* Artist List */}
        <div className="space-y-2 mb-4">
          {artists.length === 0 ? (
            <p style={{ color: "var(--text-dimmer)" }}>No artists added yet</p>
          ) : (
            artists.map((artist, index) => (
              <div
                key={artist.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="p-4 flex items-center justify-between cursor-move rounded"
                style={{
                  border: "2px solid var(--border-primary)",
                  backgroundColor: "var(--bg-main)",
                  opacity: draggedIndex === index ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xl"
                    style={{ color: "var(--text-dimmer)" }}
                  >
                    ⋮⋮
                  </span>
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: "var(--text-bright)" }}
                    >
                      {artist.artist_name}
                    </p>
                    {artist.full_legal_name && (
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {artist.full_legal_name}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveArtist(artist.id)}
                >
                  REMOVE
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Add Artist Button */}
        <Button
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
          style={{ width: "100%" }}
        >
          + ADD RELEASE ARTIST
        </Button>
      </section>
    </>
  )
}