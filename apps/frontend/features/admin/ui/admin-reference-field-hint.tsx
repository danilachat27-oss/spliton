"use client";

import Link from "next/link";
import { ExternalLink } from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

export type AdminReferenceHintKind = "artist" | "genre" | "label";

const HINT_KEYS: Record<AdminReferenceHintKind, string> = {
  artist: "admin.reference.hint.artist",
  genre: "admin.reference.hint.genre",
  label: "admin.reference.hint.label",
};

type AdminReferenceFieldHintProps = {
  href: string;
  kind?: AdminReferenceHintKind;
  /** Overrides i18n prompt before the link. */
  prompt?: string;
  /** Overrides link label (default: open dictionary). */
  actionText?: string;
  className?: string;
};

/** Unified hint under reference combobox fields — links to admin dictionary pages. */
export function AdminReferenceFieldHint({
  href,
  kind = "genre",
  prompt,
  actionText,
  className,
}: AdminReferenceFieldHintProps) {
  const a = useAdminI18n();
  const displayPrompt = prompt ?? a.t(HINT_KEYS[kind]);
  const displayAction = actionText ?? a.t("admin.reference.action.openDictionary");

  return (
    <p className={cn("text-xs leading-relaxed text-zinc-500", className)}>
      <span>{displayPrompt} </span>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-zinc-400 underline-offset-2 transition hover:text-[#B7F500] hover:underline"
      >
        {displayAction}
        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
      </Link>
    </p>
  );
}
