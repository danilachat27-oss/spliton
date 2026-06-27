import type { AdminUpdateType } from "@/services/admin/adminUpdates.service";
import { cn } from "@/lib/utils";

export const ADMIN_UPDATE_TYPES: AdminUpdateType[] = [
  "FEATURE",
  "LEGAL",
  "BILLING",
  "SECURITY",
  "MAINTENANCE",
  "UX",
  "SYSTEM",
];

export function adminUpdateTypeBadgeClass(type: string): string {
  if (type === "LEGAL") return "bg-violet-500/10 text-violet-300";
  if (type === "SECURITY") return "bg-rose-500/10 text-rose-300";
  if (type === "BILLING") return "bg-amber-500/10 text-amber-300";
  if (type === "FEATURE") return "bg-[#B7F500]/12 text-[#B7F500]";
  if (type === "UX") return "bg-sky-500/10 text-sky-300";
  if (type === "MAINTENANCE") return "bg-zinc-700/40 text-zinc-300";
  return "bg-zinc-800/80 text-zinc-400";
}

export function adminUpdateTypeBadgeClassName(type: string): string {
  return cn(
    "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
    adminUpdateTypeBadgeClass(type),
  );
}
