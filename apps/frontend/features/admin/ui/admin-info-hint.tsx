"use client";

import * as React from "react";
import { Info } from "@/lib/lucide";

import { cn } from "@/lib/utils";

type AdminInfoHintProps = {
  text: React.ReactNode;
  className?: string;
  iconClassName?: string;
  panelClassName?: string;
  size?: "sm" | "md";
  stopPropagation?: boolean;
  align?: "left" | "right";
};

/** Компактная «i» — подсказка открывается по нажатию (не только hover). */
export function AdminInfoHint({
  text,
  className,
  iconClassName,
  panelClassName,
  size = "sm",
  stopPropagation = false,
  align = "left",
}: AdminInfoHintProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const iconSize = size === "md" ? "size-4" : "size-3.5";
  const buttonSize = size === "md" ? "size-7" : "size-5";
  const ariaLabel = typeof text === "string" ? text : "Подробнее";

  return (
    <div ref={ref} className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full ring-1 transition",
          buttonSize,
          open
            ? "bg-[#B7F500]/10 text-[#B7F500] ring-[#B7F500]/35"
            : "bg-zinc-800/70 text-zinc-400 ring-zinc-700/60 hover:text-[#B7F500] hover:ring-[#B7F500]/25",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/40",
          iconClassName,
        )}
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={(event) => {
          if (stopPropagation) event.stopPropagation();
          event.preventDefault();
          setOpen((value) => !value);
        }}
      >
        <Info className={iconSize} strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div
          role="tooltip"
          className={cn(
            "absolute top-[calc(100%+0.35rem)] z-50 w-[min(calc(100vw-2rem),20rem)] rounded-xl bg-zinc-900 px-3 py-2.5 text-xs font-normal normal-case tracking-normal leading-relaxed text-zinc-300 shadow-lg ring-1 ring-zinc-700/80",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
}

type AdminSectionInfoHintProps = {
  children: React.ReactNode;
  className?: string;
  label?: string;
};

/** Блок «О разделе»: иконка всегда видна, текст — только после нажатия. */
export function AdminSectionInfoHint({ children, className, label = "О разделе" }: AdminSectionInfoHintProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full ring-1 transition",
          open
            ? "bg-[#B7F500]/10 text-[#B7F500] ring-[#B7F500]/35"
            : "bg-zinc-800/80 text-zinc-300 ring-zinc-700/60 hover:text-[#B7F500] hover:ring-[#B7F500]/25",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/40",
        )}
      >
        <Info className="size-4" strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div className="min-w-0 flex-1 rounded-2xl bg-zinc-900/45 px-4 py-3.5 text-sm leading-relaxed text-zinc-400">
          {children}
        </div>
      ) : null}
    </div>
  );
}
