import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import type { ReleaseStatus } from "@/components/ui/badge"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("releases")
    .select(`
      id,
      title,
      status,
      release_date,
      type,
      upc,
      tracks (
        id,
        title,
        licensor_shares ( id )
      ),
      contract_releases (
        contracts (
          id,
          contract_type,
          status,
          term_type,
          term_value_years,
          auto_renew_interval_years,
          notice_period_days,
          effective_at,
          expires_at,
          label_share_percent,
          licensor_pool_percent
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 })
  }

  const schedule = data.contract_releases?.[0]?.contracts ?? null

  const termDisplay = schedule
    ? buildTermDisplay({
        term_type: schedule.term_type,
        term_value_years: schedule.term_value_years,
        auto_renew_interval_years: schedule.auto_renew_interval_years,
      })
    : null

  const tracks = data.tracks ?? []
  const tracksMissingSplits = tracks.filter((t) => !t.licensor_shares || t.licensor_shares.length === 0).length

  const metrics = {
    tracksMissingSplits,
    hasReleaseDate: Boolean(data.release_date),
    hasContract: Boolean(schedule),
    advanceRecouped: schedule?.status === "executed" ? "Likely" : "Unknown",
  }

  const quickActions: Array<{ label: string; intent: "primary" | "ghost" }> = []
  const status = data.status as ReleaseStatus
  if (status === "signed" || status === "in_progress") {
    quickActions.push({ label: "Send to Mastering", intent: "primary" })
  }
  if (status === "ready_for_delivery") {
    quickActions.push({ label: "Kick Off Delivery", intent: "primary" })
  }
  if (status === "planning" || status === "signed") {
    quickActions.push({ label: "Request Splits", intent: "ghost" })
  }

  return NextResponse.json({
    release: {
      id: data.id,
      title: data.title,
      status,
      release_date: data.release_date,
      type: data.type,
      upc: data.upc,
    },
    schedule: schedule
      ? {
          id: schedule.id,
          term: termDisplay,
          label_share_percent: schedule.label_share_percent,
          licensor_pool_percent: schedule.licensor_pool_percent,
          status: schedule.status,
        }
      : null,
    metrics,
    quickActions,
  })
}

function buildTermDisplay({
  term_type,
  term_value_years,
  auto_renew_interval_years,
}: {
  term_type: string | null
  term_value_years: number | null
  auto_renew_interval_years: number | null
}) {
  switch (term_type) {
    case "perpetual":
      return "Perpetual"
    case "fixed":
      return term_value_years ? `${term_value_years} Years` : "Fixed term"
    case "auto_renew":
      return auto_renew_interval_years
        ? `Auto-renews every ${auto_renew_interval_years} yrs`
        : "Auto-renew"
    case "evergreen_with_notice":
      return "Evergreen (notice required)"
    default:
      return "No term on file"
  }
}
