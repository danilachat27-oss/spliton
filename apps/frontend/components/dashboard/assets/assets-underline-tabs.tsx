"use client";

import { cn } from "@/lib/utils";

export type AssetsUnderlineTab<T extends string = string> = {
  id: T;
  label: string;
};

export function AssetsUnderlineTabs<T extends string>({
  value,
  onChange,
  items,
  disabled,
  ariaLabel,
}: {
  value: T;
  onChange: (id: T) => void;
  items: AssetsUnderlineTab<T>[];
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      className="flex gap-5 overflow-x-auto border-b border-neutral-200 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-3 text-sm whitespace-nowrap transition-colors",
              active
                ? "border-neutral-900 font-semibold text-neutral-900"
                : "border-transparent font-medium text-neutral-500 hover:text-neutral-800",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
