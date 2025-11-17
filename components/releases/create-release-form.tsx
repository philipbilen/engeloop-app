"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { createRelease } from "@/lib/actions/releases"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface FormData {
  title: string
  type: "Single" | "EP" | "Album"
  release_date: string
}

export function CreateReleaseForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await createRelease({
        title: data.title,
        type: data.type,
        release_date: data.release_date || null,
        artist_ids: [], // TODO: Add artist selection
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create release")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] p-6 space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">Release Title</Label>
          <Input
            id="title"
            {...register("title", { required: "Title is required" })}
            placeholder="e.g., Oju"
          />
          {errors.title && (
            <p className="text-[var(--accent-danger)] text-sm mt-1">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <Label htmlFor="type">Release Type</Label>
          <Select
            id="type"
            {...register("type", { required: "Type is required" })}
          >
            <option value="">Select type...</option>
            <option value="Single">Single</option>
            <option value="EP">EP</option>
            <option value="Album">Album</option>
          </Select>
          {errors.type && (
            <p className="text-[var(--accent-danger)] text-sm mt-1">
              {errors.type.message}
            </p>
          )}
        </div>

        {/* Release Date */}
        <div>
          <Label htmlFor="release_date">Planned Release Date</Label>
          <Input
            id="release_date"
            type="date"
            {...register("release_date")}
          />
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Used to determine catalog number year
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-[var(--bg-tertiary)] border-2 border-[var(--accent-danger)] p-4">
            <p className="text-[var(--accent-danger)] font-semibold uppercase text-sm mb-1">
              ERROR
            </p>
            <p className="text-[var(--text-secondary)] text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Creating..." : "Create Release"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        {/* Info */}
        <div className="bg-[var(--bg-tertiary)] border-2 border-[var(--accent-primary)] p-4">
          <p className="text-[var(--accent-primary)] font-semibold uppercase text-sm mb-2">
            What Happens Next
          </p>
          <ul className="text-[var(--text-secondary)] text-sm space-y-1">
            <li>✓ Catalog number will be generated automatically</li>
            <li>✓ Release status set to &quot;planning&quot;</li>
            <li>✓ You&apos;ll be redirected to the detail page to add tracks, artists, and contracts</li>
            {" "}
          </ul>
        </div>
      </div>
    </form>
  )
}
