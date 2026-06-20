"use client";

import { ChevronDown } from "@/lib/lucide";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { assetsFilterSelectClass } from "@/components/dashboard/assets/assets-ui";
import { cn } from "@/lib/utils";

export function AssetsFilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-1 sm:flex-none sm:min-w-[9.5rem]", className)}>
      <p className="mb-1.5 text-xs text-neutral-500">{label}</p>
      {children}
    </div>
  );
}

type FilterOption = { value: string; label: string };

export function AssetsFilterSelect({
  value,
  options,
  onSelect,
  disabled,
  className,
}: {
  value: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => options, [options]);
  const currentLabel = items.find((o) => o.value === value)?.label ?? value;

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={assetsFilterSelectClass}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-lg bg-white">
          <ul className="max-h-56 overflow-auto py-1">
            {items.map((item) => (
              <li key={item.value}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-sm transition",
                    item.value === value
                      ? "bg-neutral-100 font-medium text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-50",
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
