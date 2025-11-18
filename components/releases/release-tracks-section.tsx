"use client"

import { useState, useTransition } from "react"
import { Database } from "@/lib/supabase/types"
import {
  createTrack,
  updateTrack,
  deleteTrack,
  reorderTracks,
} from "@/lib/actions/tracks"
import { useAutosave } from "@/lib/hooks/use-autosave"
import { formatDuration, parseDuration } from "@/lib/utils"
import { AutosaveIndicator } from "@/components/shared/autosave-indicator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddArtistModal } from "@/components/shared/add-artist-modal"
import { AddContributorModal } from "@/components/shared/add-contributor-modal"
import {
  addTrackMainArtist,
  removeTrackMainArtist,
  addTrackContributor,
  removeTrackContributor,
} from "@/lib/actions/track-links"

type Track = Database["public"]["Tables"]["tracks"]["Row"] & {
  track_main_artists?: Array<{
    artist_profiles?: Database["public"]["Tables"]["artist_profiles"]["Row"]
    position?: number | null
    inherited_from_release?: boolean | null
    artist_profile_id?: string
  }>
  track_contributors?: Array<{
    id: string
    artist_profiles?: Database["public"]["Tables"]["artist_profiles"]["Row"]
    artist_profile_id: string
    role: Database["public"]["Enums"]["credit_role"]
    role_custom?: string | null
    inherited_from_release?: boolean | null
  }>
}

interface ReleaseTracksSectionProps {
  releaseId: string
  initialTracks: Track[]
}

export function ReleaseTracksSection({
  releaseId,
  initialTracks,
}: ReleaseTracksSectionProps) {
  const [tracks, setTracks] = useState<Track[]>(
    [...initialTracks].sort((a, b) => {
      const posA = Number.isFinite(a.position) ? a.position! : 0
      const posB = Number.isFinite(b.position) ? b.position! : 0
      return posA - posB
    })
  )
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isApplying, startApplying] = useTransition()

  const handleAddTrack = async () => {
    setIsCreating(true)
    try {
      const result = await createTrack(releaseId)
      if (result.track) {
        setTracks([...tracks, result.track])
        setExpandedTrackId(result.track.id)
      }
    } catch (error) {
      console.error("Failed to create track:", error)
      alert("Failed to create track")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm("Are you sure you want to delete this track?")) {
      return
    }

    try {
      await deleteTrack(trackId, releaseId)
      setTracks(tracks.filter((t) => t.id !== trackId))
      if (expandedTrackId === trackId) {
        setExpandedTrackId(null)
      }
    } catch (error) {
      console.error("Failed to delete track:", error)
      alert("Failed to delete track")
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newTracks = [...tracks]
    const draggedTrack = newTracks[draggedIndex]
    newTracks.splice(draggedIndex, 1)
    newTracks.splice(index, 0, draggedTrack)

    setTracks(newTracks)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      try {
        await reorderTracks(
          releaseId,
          tracks.map((t) => t.id)
        )
      } catch (error) {
        console.error("Failed to reorder tracks:", error)
        alert("Failed to reorder tracks")
      }
    }
    setDraggedIndex(null)
  }

  const toggleExpand = (trackId: string) => {
    setExpandedTrackId(expandedTrackId === trackId ? null : trackId)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className="font-semibold uppercase tracking-wide"
          style={{ color: "var(--text-primary)" }}
        >
          TRACKS
        </h2>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
        </span>
      </div>

      {/* Track List */}
      <div className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-main)] divide-y divide-[var(--border-primary)]">
        {tracks.length === 0 ? (
          <p className="px-4 py-3" style={{ color: "var(--text-muted)" }}>No tracks yet</p>
        ) : (
          tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isExpanded={expandedTrackId === track.id}
              onToggle={() => toggleExpand(track.id)}
              onDelete={() => handleDeleteTrack(track.id)}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
              releaseId={releaseId}
            />
          ))
        )}
      </div>

      {/* Add Track Button */}
      <Button
        variant="secondary"
        onClick={handleAddTrack}
        disabled={isCreating}
        style={{ width: "100%" }}
      >
        {isCreating ? "CREATING..." : "+ ADD TRACK"}
      </Button>
    </section>
  )
}

interface TrackRowProps {
  track: Track
  index: number
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
  releaseId: string
}

function TrackRow({
  track,
  index,
  isExpanded,
  onToggle,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  releaseId,
}: TrackRowProps) {
  const [formData, setFormData] = useState({
    title: track.title,
    version: track.version || "",
    duration_str: formatDuration(track.duration_ms),
    isrc: track.isrc || "",
  })

  const autosave = useAutosave({
    value: formData,
    onSave: async (data) => {
      await updateTrack(track.id, releaseId, {
        title: data.title,
        version: data.version || null,
        duration_ms: data.duration_str.trim() ? parseDuration(data.duration_str) : null,
        isrc: data.isrc || null,
      })
    },
    delay: 500,
    enabled: isExpanded,
  })

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const [isArtistModalOpen, setArtistModalOpen] = useState(false)
  const [isContributorModalOpen, setContributorModalOpen] = useState(false)
  const [isPending, startPending] = useTransition()

  const handleAddTrackArtist = (artist: Database["public"]["Tables"]["artist_profiles"]["Row"]) => {
    startPending(async () => {
      await addTrackMainArtist(track.id, artist.id, releaseId)
    })
  }

  const handleRemoveTrackArtist = (artistId: string) => {
    startPending(async () => {
      await removeTrackMainArtist(track.id, artistId, releaseId)
    })
  }

  const handleAddTrackContributor = (artistProfileId: string, role: Database["public"]["Enums"]["credit_role"], role_custom?: string | null) => {
    startPending(async () => {
      await addTrackContributor(track.id, artistProfileId, role, releaseId, role_custom)
    })
  }

  const handleRemoveTrackContributor = (contributorId: string) => {
    startPending(async () => {
      await removeTrackContributor(contributorId, releaseId)
    })
  }

  return (
    <div
      className="bg-[var(--bg-secondary)]"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <AddArtistModal
        isOpen={isArtistModalOpen}
        onClose={() => setArtistModalOpen(false)}
        onSelect={handleAddTrackArtist}
        excludeIds={(track.track_main_artists || []).map((a) => a.artist_profiles?.id || "").filter(Boolean)}
      />
      <AddContributorModal
        isOpen={isContributorModalOpen}
        onClose={() => setContributorModalOpen(false)}
        onAdd={handleAddTrackContributor}
        existingContributors={
          (track.track_contributors || []).map((c) => ({
            id: c.id,
            artist_profile_id: c.artist_profile_id,
            role: c.role,
            artist_profiles: c.artist_profiles,
          })) as any
        }
      />
      {/* Track Header */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        className="p-4 flex items-center gap-3 cursor-move"
        onClick={onToggle}
      >
        <span className="text-xl" style={{ color: "var(--text-muted)" }}>
          ⋮⋮
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              {track.title}
              {track.version && (
                <span style={{ color: "var(--text-secondary)" }}>
                  {" "}
                  ({track.version})
                </span>
              )}
            </p>
          </div>
          {track.duration_ms && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {formatDuration(track.duration_ms)}
            </p>
          )}
        </div>
        <button
          className="text-xl transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-main)] rounded-b-md space-y-6">
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-primary)" }}
            >
              TRACK DETAILS
            </h3>
            <AutosaveIndicator autosave={autosave} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <Label htmlFor={`track-title-${track.id}`}>Title</Label>
              <Input
                id={`track-title-${track.id}`}
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Track title"
              />
            </div>

            {/* Version */}
            <div>
              <Label htmlFor={`track-version-${track.id}`}>Version</Label>
              <Input
                id={`track-version-${track.id}`}
                value={formData.version}
                onChange={(e) => handleChange("version", e.target.value)}
                placeholder="e.g., Extended Mix"
              />
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor={`track-duration-${track.id}`}>
                Duration (MM:SS)
              </Label>
              <Input
                id={`track-duration-${track.id}`}
                type="text"
                value={formData.duration_str}
                onChange={(e) => handleChange("duration_str", e.target.value)}
                placeholder="03:30"
              />
            </div>

            {/* ISRC */}
            <div>
              <Label htmlFor={`track-isrc-${track.id}`}>ISRC</Label>
              <Input
                id={`track-isrc-${track.id}`}
                value={formData.isrc}
                onChange={(e) => handleChange("isrc", e.target.value)}
                placeholder="Assigned by distributor"
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="danger" size="sm" onClick={onDelete}>
              DELETE TRACK
            </Button>
          </div>

          {/* Track Artists */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>
                Track Artists
              </h4>
            </div>
            <div className="divide-y divide-[var(--border-primary)] rounded-md border border-[var(--border-primary)] bg-[var(--bg-main)]">
              {(track.track_main_artists || []).map((artist) => (
                <div
                  key={artist.artist_profiles?.id || artist.artist_profile_id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--text-bright)" }}>
                      {artist.artist_profiles?.artist_name || "Unknown Artist"}
                    </span>
                    {artist.inherited_from_release && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--bg-interactive)", color: "var(--accent-primary)" }}>
                        Inherited
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveTrackArtist(artist.artist_profiles?.id || artist.artist_profile_id || "")}
                    disabled={isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {(track.track_main_artists || []).length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No track artists yet.
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => setArtistModalOpen(true)}
              disabled={isPending}
            >
              + Add Track Artist
            </Button>
          </div>

          {/* Track Contributors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>
                Track Contributors
              </h4>
            </div>
            <div className="divide-y divide-[var(--border-primary)] rounded-md border border-[var(--border-primary)] bg-[var(--bg-main)]">
              {(track.track_contributors || []).map((contrib) => (
                <div
                  key={contrib.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium" style={{ color: "var(--text-bright)" }}>
                        {contrib.artist_profiles?.artist_name || "Unknown"}
                      </p>
                      <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                        {contrib.role_custom || contrib.role}
                      </p>
                    </div>
                    {contrib.inherited_from_release && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--bg-interactive)", color: "var(--accent-primary)" }}>
                        Inherited
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveTrackContributor(contrib.id)}
                    disabled={isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {(track.track_contributors || []).length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No track contributors yet.
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => setContributorModalOpen(true)}
              disabled={isPending}
            >
              + Add Track Contributor
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
