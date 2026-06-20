"use client";

import { cn } from "@/lib/utils";

type AdminAnalyticsKpiGroupProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function AdminAnalyticsKpiGroup({
  title,
  description,
  children,
  className,
}: AdminAnalyticsKpiGroupProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-zinc-500">{description}</p> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}
