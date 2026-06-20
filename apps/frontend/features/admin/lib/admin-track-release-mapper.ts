import type { AdminReleaseRow } from "@/features/admin/mocks/admin-data";
import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";

function mapTrackStatus(status: AdminTrackListItem["status"]): AdminReleaseRow["status"] {
  switch (status) {
    case "active":
    case "published":
      return "listed";
    case "paused":
      return "paused";
    case "completed":
      return "settled";
    default:
      return "draft";
  }
}

function mapPhase(status: AdminTrackListItem["status"]): AdminReleaseRow["phase"] {
  if (status === "active" || status === "published" || status === "completed") return "secondary";
  if (status === "review") return "fundraising";
  return "draft_review";
}

function pctRemaining(available: string, total: string): string {
  const a = Number(String(available).replace(/[^\d.-]/g, ""));
  const t = Number(String(total).replace(/[^\d.-]/g, ""));
  if (t <= 0) return "0";
  return String(Math.round((a / t) * 100));
}

/** Map live track list row to legacy catalog card shape (display only). */
export function trackToReleaseCard(track: AdminTrackListItem): AdminReleaseRow {
  const updated = track.updatedAt || track.createdAt;
  return {
    id: track.id,
    slug: track.id,
    title: track.title,
    artistLabel: track.artist,
    ticker:
      track.title
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 4)
        .toUpperCase() || "TRK",
    genre: track.genre || "\u2014",
    status: mapTrackStatus(track.status),
    phase: mapPhase(track.status),
    goalUsdt: track.raiseTargetUsdt || track.hardCapUsdt || "\u2014",
    raisedUsdt: track.hardCapUsdt ? "\u2014" : "0",
    totalUnitsUnt: track.totalUnits,
    unitsOutstanding: track.availableUnits,
    unitPriceUsdt: track.primaryUnitPrice,
    investorSharePct: track.holderSharePct || "\u2014",
    forecastYieldPct: "\u2014",
    investorPoolRemainingPct: pctRemaining(track.availableUnits, track.totalUnits),
    promoUsdt: track.promoBudgetUsdt || "\u2014",
    artistAdvanceUsdt: track.artistUpfrontUsdt || "\u2014",
    platformAdvanceUsdt: track.platformUpfrontUsdt || "\u2014",
    updatedAt: updated.slice(0, 10),
    isrc: track.isrc,
    territory: "Worldwide",
  };
}
