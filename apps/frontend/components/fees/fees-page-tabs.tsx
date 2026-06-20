"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type FeesTabItem<T extends string> = {
  id: T;
  label: string;
};

type FeesPageTabsProps<T extends string> = {
  items: FeesTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  size?: "main" | "sub";
};

export function FeesPageTabs<T extends string>({
  items,
  active,
  onChange,
  className,
  size = "main",
}: FeesPageTabsProps<T>) {
  const { t } = useI18n();
  const isMain = size === "main";

  return (
    <nav
      className={cn(
        "flex items-end gap-6 overflow-x-auto overflow-y-hidden border-b border-neutral-200/90",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "md:overflow-x-visible",
        isMain ? "gap-8" : "gap-5",
        className,
      )}
      aria-label={t("fees.tabs.navAria")}
    >
      {items.map((item) => {
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "relative shrink-0 pb-3 text-left font-semibold transition-colors",
              isMain ? "text-sm sm:text-base" : "text-sm",
              selected ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800",
            )}
            aria-current={selected ? "page" : undefined}
          >
            {item.label}
            {selected ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-900" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
