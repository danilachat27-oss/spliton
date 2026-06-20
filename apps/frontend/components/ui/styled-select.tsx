"use client";

import { ChevronDown } from "@/lib/lucide";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type StyledSelectOption = {
  value: string;
  label: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "below" | "above";
};

type StyledSelectProps = {
  value: string;
  options: readonly StyledSelectOption[];
  onChange: (value: string) => void;
  id?: string;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  /** Минимальная ширина выпадающего списка (может быть шире триггера). */
  menuMinWidth?: number;
  /** Максимальная ширина выпадающего списка. */
  menuMaxWidth?: number;
  placeholder?: string;
  size?: "sm" | "md";
  variant?: "default" | "soft" | "okx";
  tone?: "light" | "dark";
  fullWidth?: boolean;
  align?: "start" | "end";
  borderless?: boolean;
  "aria-label"?: string;
};

function menuSurfaceClass(
  tone: StyledSelectProps["tone"],
  variant: StyledSelectProps["variant"],
  borderless: boolean,
) {
  if (tone === "dark") {
    return borderless
      ? "border border-zinc-800/80 bg-[#1a1a1d] shadow-[0_16px_40px_-20px_rgba(0,0,0,0.6)]"
      : "border border-white/10 bg-zinc-900 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.6)]";
  }
  if (variant === "okx") {
    return "rounded-lg border border-[#EEEEEE] bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]";
  }
  return "border border-neutral-200 bg-white shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]";
}

export function StyledSelect({
  value,
  options,
  onChange,
  id,
  icon,
  disabled = false,
  className,
  menuClassName,
  menuMinWidth,
  menuMaxWidth = 360,
  placeholder,
  size = "md",
  variant = "default",
  tone = "light",
  fullWidth = false,
  align = "start",
  borderless = false,
  "aria-label": ariaLabel,
}: StyledSelectProps) {
  const { t } = useI18n();
  const autoId = useId();
  const triggerId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const resolvedPlaceholder = placeholder ?? t("form.selectPlaceholder");

  const items = useMemo(() => options, [options]);
  const currentLabel = items.find((o) => o.value === value)?.label ?? resolvedPlaceholder;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const viewportPadding = 12;
    const preferredMax = 280;
    const minVisible = 160;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
    const spaceAbove = rect.top - viewportPadding - gap;
    const openAbove = spaceBelow < minVisible && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      preferredMax,
      Math.max(120, openAbove ? spaceAbove : spaceBelow),
    );
    const labelWidthEstimate = items.reduce(
      (max, item) => Math.max(max, item.label.length * 7.2 + 28),
      0,
    );
    const menuWidth = Math.min(
      menuMaxWidth,
      Math.max(rect.width, menuMinWidth ?? 0, labelWidthEstimate, tone === "dark" ? 240 : 200),
    );
    const left =
      align === "end"
        ? Math.max(viewportPadding, rect.right - menuWidth)
        : Math.min(rect.left, window.innerWidth - menuWidth - viewportPadding);

    setMenuPos({
      top: openAbove ? rect.top - gap : rect.bottom + gap,
      left,
      width: menuWidth,
      maxHeight,
      placement: openAbove ? "above" : "below",
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, align, items, menuMinWidth, menuMaxWidth, tone]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menuStyle: CSSProperties | undefined = menuPos
    ? {
        position: "fixed",
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        minWidth: menuPos.width,
        zIndex: 1100,
        transform: menuPos.placement === "above" ? "translateY(-100%)" : undefined,
      }
    : undefined;

  const menu = open && menuPos ? (
    <div
      ref={menuRef}
      role="listbox"
      aria-labelledby={triggerId}
      style={menuStyle}
      className={cn(
        "overflow-hidden rounded-xl",
        menuSurfaceClass(tone, variant, borderless),
        menuClassName,
      )}
    >
      <ul
        style={{ maxHeight: menuPos.maxHeight }}
        className={cn(
          "overflow-x-hidden overflow-y-auto overscroll-contain py-1.5",
          tone === "dark" ? "admin-select-menu-scroll" : undefined,
        )}
      >
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <li key={item.value || "__empty"}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-3.5 text-left transition",
                  tone === "dark" ? "py-2 text-[13px] leading-snug whitespace-nowrap" : "py-2.5 text-sm leading-snug",
                  selected
                    ? tone === "dark"
                      ? "bg-[#B7F500]/10 font-medium text-zinc-100"
                      : variant === "okx"
                        ? "bg-[#F5F5F5] font-medium text-black"
                        : "bg-[#B7F500]/14 font-semibold text-neutral-900 ring-1 ring-inset ring-[#B7F500]/20"
                    : tone === "dark"
                      ? "text-zinc-300 hover:bg-zinc-800/80"
                      : variant === "okx"
                        ? "text-black hover:bg-[#F5F5F5]"
                        : "text-neutral-700 hover:bg-neutral-50",
                )}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={cn("relative overflow-visible", fullWidth && "w-full", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center justify-between gap-2 whitespace-nowrap rounded-xl border font-medium transition",
          size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-[13px]",
          fullWidth && "w-full",
          tone === "dark"
            ? cn(
                borderless
                  ? "border-0 bg-black/40 text-white hover:bg-black/50"
                  : "border-white/10 bg-zinc-800 text-white hover:bg-zinc-700/90",
                open &&
                  (borderless
                    ? "bg-black/55 ring-0"
                    : "border-white/20 bg-zinc-800 ring-2 ring-[#B7F500]/15"),
              )
            : variant === "okx"
              ? cn(
                  "rounded-lg border-0 bg-[#F5F5F5] font-normal text-black hover:bg-[#EBEBEB]",
                  open && "bg-white shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]",
                )
              : cn(
                  variant === "soft"
                    ? "border-0 bg-neutral-50 text-neutral-900 hover:bg-neutral-100"
                    : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100",
                  open &&
                    (variant === "soft"
                      ? "bg-white ring-2 ring-[#B7F500]/20"
                      : "border-neutral-300 bg-white"),
                ),
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {icon}
          <span className="truncate">{currentLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            variant === "okx" ? "text-[#848E9C]" : "text-neutral-400",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

export function StyledSelectField({
  label,
  className,
  variant = "default",
  ...props
}: { label: string; className?: string } & StyledSelectProps) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1.5",
        variant === "okx" ? "text-xs font-medium text-neutral-700" : "text-xs text-neutral-500",
        className,
      )}
    >
      <span>{label}</span>
      <StyledSelect {...props} variant={variant} fullWidth={props.fullWidth ?? true} />
    </label>
  );
}
