"use client";

import { cn } from "@/lib/utils";

export type AssetsPillTab<T extends string = string> = {
  id: T;
  label: string;
};

export function AssetsScrollPillTabs<T extends string>({
  value,
  onChange,
  items,
  disabled,
  ariaLabel,
  size = "default",
}: {
  value: T;
  onChange: (id: T) => void;
  items: AssetsPillTab<T>[];
  disabled?: boolean;
  ariaLabel?: string;
  size?: "default" | "compact";
}) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:x_mandatory] [&::-webkit-scrollbar]:hidden"
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
              "shrink-0 scroll-snap-start rounded-full font-medium transition-colors active:scale-[0.98]",
              size === "compact" ? "px-3 py-1.5 text-[12px]" : "px-3.5 py-2 text-[13px]",
              active
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900",
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
