const STORAGE_KEY = "spliton_analytics_local_notes_v1";

export type LocalReleaseNotes = Record<string, boolean>;

export function readLocalReleaseNotes(): LocalReleaseNotes {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as LocalReleaseNotes;
  } catch {
    return {};
  }
}

export function writeLocalReleaseNotes(notes: LocalReleaseNotes): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore quota / private mode
  }
}
