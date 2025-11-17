"use client"

import { useState } from "react"
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

type Track = Database["public"]["Tables"]["tracks"]["Row"]

interface ReleaseTracksSectionProps {
  releaseId: string
  initialTracks: Track[]
}

export function ReleaseTracksSection({
  releaseId,
  initialTracks,
}: ReleaseTracksSectionProps) {
  const [tracks, setTracks] = useState<Track[]>(
    initialTracks.sort((a, b) => a.position - b.position)
  )
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

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
    <section
      className="p-6"
      style={{
        border: "2px solid var(--border-primary)",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
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
      <div className="space-y-2 mb-4">
        {tracks.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No tracks yet</p>
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
        duration_ms: parseDuration(data.duration_str),
        isrc: data.isrc || null,
      })
    },
    delay: 500,
    enabled: isExpanded,
  })

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div
      style={{
        border: "2px solid var(--border-primary)",
        backgroundColor: "var(--bg-tertiary)",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
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
        <div
          className="p-4"
          style={{
            borderTop: "2px solid var(--border-primary)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-primary)" }}
            >
              TRACK DETAILS
            </h3>
            <AutosaveIndicator autosave={autosave} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
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

          {/* Delete Button */}
          <div className="flex justify-end">
            <Button variant="danger" size="sm" onClick={onDelete}>
              DELETE TRACK
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}