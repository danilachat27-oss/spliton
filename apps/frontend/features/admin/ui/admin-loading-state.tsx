"use client";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { SplitonLoader } from "@/components/ui/spliton-loader";
import { cn } from "@/lib/utils";
import { adminCard } from "@/features/admin/lib/admin-ui";

type AdminLoadingStateProps = {
  label?: string;
  className?: string;
  /** Тёмная карточка (drawer) — белое кольцо */
  variant?: "light" | "dark";
  /** Вертикально центрировать в области страницы (секции), не в drawer */
  centered?: boolean;
  /** Отступ сверху и слева внутри карточки (страница профиля и т.п.) */
  inset?: boolean;
};

export function AdminLoadingState({
  label,
  className,
  variant = "dark",
  centered = false,
  inset = false,
}: AdminLoadingStateProps) {
  const a = useAdminI18n();
  const displayLabel = label ?? a.empty.loading;

  return (
    <div
      className={cn(
        adminCard("flex flex-col gap-3 px-6 py-16"),
        inset
          ? "min-h-[min(50vh,440px)] items-start justify-start px-6 py-10 sm:px-8 sm:py-12"
          : "items-center justify-center",
        centered && !inset && "min-h-[min(60vh,520px)]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <SplitonLoader size="md" variant="light" label={displayLabel} />
      <p className="text-sm text-zinc-400">
        {displayLabel}
      </p>
    </div>
  );
}
