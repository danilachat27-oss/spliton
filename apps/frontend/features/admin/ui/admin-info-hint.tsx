"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Info } from "@/lib/lucide";

import { cn } from "@/lib/utils";

type AdminInfoHintProps = {
  text: React.ReactNode;
  className?: string;
  iconClassName?: string;
  panelClassName?: string;
  size?: "sm" | "md";
  stopPropagation?: boolean;
  /** @deprecated use placement */
  align?: "left" | "right";
  placement?: "bottom-start" | "bottom-end" | "top-end";
};

function useFloatingPanelStyle(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  placement: "bottom-start" | "bottom-end" | "top-end",
) {
  const [style, setStyle] = React.useState<React.CSSProperties>({ visibility: "hidden" });

  React.useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      const gap = 8;
      const viewportPad = 12;

      if (placement === "top-end") {
        setStyle({
          position: "fixed",
          top: Math.max(viewportPad, rect.top - gap),
          left: Math.min(window.innerWidth - viewportPad, rect.right),
          transform: "translate(-100%, -100%)",
          visibility: "visible",
        });
        return;
      }

      if (placement === "bottom-end") {
        setStyle({
          position: "fixed",
          top: rect.bottom + gap,
          left: Math.min(window.innerWidth - viewportPad, rect.right),
          transform: "translateX(-100%)",
          visibility: "visible",
        });
        return;
      }

      setStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left: Math.max(viewportPad, rect.left),
        visibility: "visible",
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, placement, anchorRef]);

  return style;
}

/** Компактная «i» — подсказка открывается по нажатию (не только hover). */
export function AdminInfoHint({
  text,
  className,
  iconClassName,
  panelClassName,
  size = "sm",
  stopPropagation = false,
  align = "left",
  placement,
}: AdminInfoHintProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const isToolbar = Boolean(iconClassName);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedPlacement =
    placement ?? (align === "right" ? "bottom-end" : "bottom-start");
  const panelStyle = useFloatingPanelStyle(open, anchorRef, resolvedPlacement);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
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
  const buttonSize = size === "md" ? "size-9" : "size-5";
  const ariaLabel = typeof text === "string" ? text : "Подробнее";

  const panel = open && mounted ? (
    createPortal(
      <div
        ref={panelRef}
        role="tooltip"
        style={panelStyle}
        className={cn(
          "z-[200] w-max max-w-[min(20rem,calc(100vw-1.5rem))] rounded-xl bg-zinc-900 px-3 py-2.5 text-xs font-normal normal-case tracking-normal leading-relaxed text-zinc-300 shadow-xl shadow-black/40 ring-1 ring-zinc-700/80",
          panelClassName,
        )}
      >
        {text}
      </div>,
      document.body,
    )
  ) : null;

  return (
    <>
      <div ref={anchorRef} className={cn("relative inline-flex align-middle", className)}>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center justify-center transition",
            isToolbar ? "rounded-xl ring-0" : "rounded-full ring-1",
            isToolbar ? buttonSize : size === "md" ? "size-7" : buttonSize,
            open
              ? isToolbar
                ? "bg-zinc-800 text-zinc-100"
                : "bg-[#B7F500]/10 text-[#B7F500] ring-[#B7F500]/35"
              : isToolbar
                ? "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
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
      </div>
      {panel}
    </>
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
