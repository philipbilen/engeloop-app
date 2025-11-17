/**
 * Formats an array of artist names into a display line following DSP conventions
 * Examples:
 * - 1 artist: "Naarly"
 * - 2 artists: "Naarly & OOVA"
 * - 3+ artists: "Naarly, OOVA & Dawda"
 *
 * @param artists - Array of artist stage names, ordered by position
 * @param maxArtists - Maximum artists to show (default: 4, DSP standard)
 * @returns Formatted artist display string
 */
export function formatArtistDisplayLine(
  artists: Array<{ stage_name: string }>,
  maxArtists: number = 4
): string {
  if (!artists || artists.length === 0) {
    return "—"
  }

  // Take only up to maxArtists
  const displayArtists = artists.slice(0, maxArtists)
  const names = displayArtists.map(a => a.stage_name)

  if (names.length === 1) {
    return names[0]
  }

  if (names.length === 2) {
    return `${names[0]} & ${names[1]}`
  }

  // 3+ artists: "Artist1, Artist2 & Artist3"
  const allButLast = names.slice(0, -1).join(", ")
  const last = names[names.length - 1]
  return `${allButLast} & ${last}`
}
