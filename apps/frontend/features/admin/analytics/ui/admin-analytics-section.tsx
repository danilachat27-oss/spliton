"use client";

import { adminCard } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/** Мягкая секция без тяжёлых бордеров */
export function AdminAnalyticsSection({ title, description, children, className }: Props) {
  return (
    <section className={cn(adminCard("p-5"), className)}>
      {title ? (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-zinc-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
