"use client";

import { supportTicketStatusLabel } from "@/lib/i18n/support-messages";
import type { AppLocale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, "amber" | "emerald" | "neutral" | "sky"> = {
  open: "amber",
  in_progress: "amber",
  waiting_user: "sky",
  escalated: "amber",
  closed: "neutral",
};

export const okxFieldClass =
  "h-11 w-full rounded-lg border-0 bg-[#F5F5F5] px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]";

export const okxTextareaClass =
  "min-h-28 w-full rounded-lg border-0 bg-[#F5F5F5] px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]";

export function shortSupportTicketId(id: string) {
  return id.length > 8 ? `SP-${id.slice(0, 8).toUpperCase()}` : `SP-${id.toUpperCase()}`;
}

export function SupportTicketStatusBadge({
  status,
  locale,
}: {
  status: string;
  locale: AppLocale;
}) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
        tone === "amber" && "bg-amber-100 text-amber-900",
        tone === "sky" && "bg-sky-100 text-sky-900",
        tone === "emerald" && "bg-emerald-100 text-emerald-800",
        tone === "neutral" && "bg-neutral-100 text-neutral-700",
      )}
    >
      {supportTicketStatusLabel(status, locale)}
    </span>
  );
}
