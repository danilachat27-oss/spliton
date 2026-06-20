"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "@/lib/lucide";

import { cn } from "@/lib/utils";

export function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
  tone = "brand",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
  tone?: "brand" | "neutral";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex w-full items-center gap-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 transition-colors hover:text-zinc-400",
        align === "right" && "justify-end",
      )}
    >
      <span>{label}</span>
      <span className="flex flex-col leading-none">
        <ChevronUp
          className={cn(
            "-mb-0.5 size-3",
            active && dir === "asc"
              ? tone === "neutral"
                ? "text-zinc-200"
                : "text-[#B7F500]"
              : "text-zinc-700 group-hover:text-zinc-600",
          )}
        />
        <ChevronDown
          className={cn(
            "size-3",
            active && dir === "desc"
              ? tone === "neutral"
                ? "text-zinc-200"
                : "text-[#B7F500]"
              : "text-zinc-700 group-hover:text-zinc-600",
          )}
        />
      </span>
    </button>
  );
}
