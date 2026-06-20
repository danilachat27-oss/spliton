"use client";

import Link from "next/link";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminBreadcrumbsProps = {
  items: AdminBreadcrumbItem[];
  className?: string;
};

export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
  const a = useAdminI18n();

  return (
    <nav
      className={cn("flex flex-wrap items-center gap-1 text-xs text-zinc-500", className)}
      aria-label={a.t("admin.aria.breadcrumb")}
    >
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 ? <span className="text-zinc-300">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-zinc-200">
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
