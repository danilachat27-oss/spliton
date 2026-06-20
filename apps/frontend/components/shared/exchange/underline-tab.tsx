"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export function UnderlineTab({
  active,
  children,
  onClick,
  tone = "brand",
  size = "default",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "brand" | "neutral";
  size?: "default" | "exchange";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative shrink-0 px-2 font-semibold tracking-tight transition-colors",
        size === "exchange"
          ? "h-11 text-[15px] sm:text-[13px]"
          : "h-9 px-0.5 font-mono text-[12px] tracking-wide",
        active ? "text-white" : "text-zinc-500 hover:text-zinc-300",
      )}
    >
      {children}
      {active ? (
        <span
          className={cn(
            "absolute inset-x-1 bottom-0 h-[2px] rounded-full",
            tone === "neutral" || size === "exchange"
              ? "bg-white"
              : "bg-[#B7F500] shadow-[0_0_12px_rgba(183,245,0,0.4)]",
          )}
          aria-hidden
        />
      ) : null}
    </button>
  );
}
