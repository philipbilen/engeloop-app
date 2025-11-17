import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats milliseconds into a MM:SS string.
 * @param ms - The duration in milliseconds.
 * @returns A string in MM:SS format.
 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return "00:00"
  }
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Parses a MM:SS string into milliseconds.
 * @param time - A string in MM:SS format.
 * @returns The duration in milliseconds, or 0 if invalid.
 */
export function parseDuration(time: string): number {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
    return 0
  }
  const parts = time.split(':')
  const minutes = parseInt(parts[0], 10)
  const seconds = parseInt(parts[1], 10)
  if (isNaN(minutes) || isNaN(seconds)) {
    return 0
  }
  return (minutes * 60 + seconds) * 1000
}