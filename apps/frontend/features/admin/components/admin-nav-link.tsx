"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";

import { cn } from "@/lib/utils";

function NavPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "ml-auto size-1.5 shrink-0 rounded-full bg-lime-400/90 transition-opacity duration-150",
        pending ? "opacity-100 animate-pulse" : "opacity-0",
      )}
    />
  );
}

type AdminNavLinkProps = {
  href: string;
  active: boolean;
  collapsed: boolean;
  title: string;
  className?: string;
  children: ReactNode;
  external?: boolean;
  /** Playwright / e2e hook */
  testId?: string;
};

export function AdminNavLink({
  href,
  active,
  collapsed,
  title,
  className,
  children,
  external,
  testId,
}: AdminNavLinkProps) {
  const linkProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
    : {};

  return (
    <Link
      href={href}
      prefetch
      scroll={false}
      title={title}
      data-testid={testId}
      {...linkProps}
      className={className}
    >
      {children}
      {!collapsed && !external ? <NavPendingHint /> : null}
    </Link>
  );
}
