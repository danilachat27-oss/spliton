"use client";

import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/** Секция аналитики — borderless tile в стиле операторской панели. */
export function AdminAnalyticsSection({ title, description, children, className }: Props) {
  return (
    <section className={cn(ADMIN_SECTION_TILE, "min-w-0", className)}>
      {title ? (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          {description ? <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
