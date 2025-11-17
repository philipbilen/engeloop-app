"use client"

import { useState } from "react"
import { Database } from "@/lib/supabase/types"
import { updateRelease } from "@/lib/actions/releases"
import { useAutosave } from "@/lib/hooks/use-autosave"
import { AutosaveIndicator } from "@/components/shared/autosave-indicator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Release = Database["public"]["Tables"]["releases"]["Row"]

interface ReleaseMetadataSectionProps {
  release: Release
}

export function ReleaseMetadataSection({
  release,
}: ReleaseMetadataSectionProps) {
  const [formData, setFormData] = useState({
    title: release.title,
    version: release.version || "",
    release_date: release.release_date || "",
    primary_genre: release.primary_genre || "",
    upc: release.upc || "",
  })

  const autosave = useAutosave({
    value: formData,
    onSave: async (data) => {
      await updateRelease(release.id, {
        title: data.title,
        version: data.version || null,
        release_date: data.release_date || null,
        primary_genre: data.primary_genre || null,
        upc: data.upc || null,
      })
    },
    delay: 500,
  })

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
          METADATA
        </h2>
        <AutosaveIndicator autosave={autosave} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Release title"
          />
        </div>

        {/* Version */}
        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => handleChange("version", e.target.value)}
            placeholder="e.g., Extended Mix, Radio Edit"
          />
        </div>

        {/* Release Date */}
        <div>
          <Label htmlFor="release_date">Release Date</Label>
          <Input
            id="release_date"
            type="date"
            value={formData.release_date}
            onChange={(e) => handleChange("release_date", e.target.value)}
          />
        </div>

        {/* Primary Genre */}
        <div>
          <Label htmlFor="primary_genre">Primary Genre</Label>
          <Input
            id="primary_genre"
            value={formData.primary_genre}
            onChange={(e) => handleChange("primary_genre", e.target.value)}
            placeholder="e.g., Afro House, Deep House"
          />
        </div>

        {/* UPC */}
        <div className="col-span-2">
          <Label htmlFor="upc">UPC</Label>
          <Input
            id="upc"
            value={formData.upc}
            onChange={(e) => handleChange("upc", e.target.value)}
            placeholder="Assigned by distributor"
            className="font-mono"
          />
          <p className="text-sm mt-2" style={{ color: 'var(--text-dimmer)' }}>
            Universal Product Code from distributor (e.g., ADA)
          </p>
        </div>
      </div>
    </section>
  )
}