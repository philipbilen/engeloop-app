"use client"

import { useState, useTransition } from "react" // Removed useEffect as it's no longer used
import { Database } from "@/lib/supabase/types"
import { updateMainArtists } from "@/lib/actions/artists"
import { Button } from "@/components/ui/button"
import { AddArtistModal } from "@/components/shared/add-artist-modal"
import { fanOutTrackMainArtists, removeInheritedTrackMainArtists } from "@/lib/actions/track-links"

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
  const [isApplyingAll, startApplyingAll] = useTransition()

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

  const handleApplyAllTracks = (artistId: string) => {
    startApplyingAll(async () => {
      await fanOutTrackMainArtists(releaseId, [artistId])
    })
  }

  const handleRemoveInheritedFromTracks = (artistId: string) => {
    startApplyingAll(async () => {
      await removeInheritedTrackMainArtists(releaseId, [artistId])
    })
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
        <div className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-deep-dark)] mb-4 overflow-hidden">
          {artists.length === 0 ? (
            <p className="p-4" style={{ color: "var(--text-dimmer)" }}>No artists added yet</p>
          ) : (
            artists.map((artist, index) => (
              <div
                key={artist.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="p-4 flex items-center justify-between cursor-move even:bg-white/5 hover:bg-white/5 transition-colors"
                style={{
                  opacity: draggedIndex === index ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-lg text-[var(--text-dimmer)] opacity-50 hover:opacity-100"
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleApplyAllTracks(artist.id)}
                    disabled={isApplyingAll}
                  >
                    Apply to Tracks
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInheritedFromTracks(artist.id)}
                    disabled={isApplyingAll}
                  >
                    Remove from Tracks
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveArtist(artist.id)}
                  >
                    Remove
                  </Button>
                </div>
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
