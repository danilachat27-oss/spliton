"use client";

import { ChevronDown } from "@/lib/lucide";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type StyledSelectOption = {
  value: string;
  label: string;
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
  placeholder?: string;
  size?: "sm" | "md";
  variant?: "default" | "soft" | "okx";
  tone?: "light" | "dark";
  fullWidth?: boolean;
  align?: "start" | "end";
  borderless?: boolean;
  "aria-label"?: string;
};

export function StyledSelect({
  value,
  options,
  onChange,
  id,
  icon,
  disabled = false,
  className,
  menuClassName,
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
  const [open, setOpen] = useState(false);
  const resolvedPlaceholder = placeholder ?? t("form.selectPlaceholder");

  const items = useMemo(() => options, [options]);
  const currentLabel = items.find((o) => o.value === value)?.label ?? resolvedPlaceholder;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={rootRef} className={cn("relative", fullWidth && "w-full", className)}>
      <button
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

      {open ? (
        <div
          role="listbox"
          aria-labelledby={triggerId}
          className={cn(
            "absolute top-[calc(100%+6px)] z-50 min-w-full overflow-hidden rounded-xl border shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]",
            tone === "dark"
              ? borderless
                ? "border-0 bg-[#1a1a1a] shadow-[0_16px_40px_-20px_rgba(0,0,0,0.6)]"
                : "border-white/10 bg-zinc-900"
              : variant === "okx"
                ? "rounded-lg border border-[#EEEEEE] bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
                : "border-neutral-200 bg-white",
            align === "end" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          <ul
            className={cn(
              "max-h-64 overflow-x-hidden overflow-y-auto py-1",
              tone === "dark" && "revshare-scrollbar",
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
                      "flex w-full items-center px-3 py-2.5 text-left text-[13px] transition",
                      selected
                        ? tone === "dark"
                          ? "bg-[#B7F500]/14 font-semibold text-white ring-1 ring-inset ring-[#B7F500]/25"
                          : variant === "okx"
                            ? "bg-[#F5F5F5] font-medium text-black"
                            : "bg-[#B7F500]/14 font-semibold text-neutral-900 ring-1 ring-inset ring-[#B7F500]/20"
                        : tone === "dark"
                          ? "text-zinc-300 hover:bg-white/5"
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
      ) : null}
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
