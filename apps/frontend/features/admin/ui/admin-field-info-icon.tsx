"use client";

import { Info } from "@/lib/lucide";
import { cn } from "@/lib/utils";

type AdminFieldInfoProps = {
  text: string;
  className?: string;
};

/** Compact (i) hint next to admin field labels — shows full explanation on hover/focus. */
export function AdminFieldInfo({ text, className }: AdminFieldInfoProps) {
  return (
    <button
      type="button"
      tabIndex={0}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/40",
        className,
      )}
      title={text}
      aria-label={text}
    >
      <Info className="size-3.5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
