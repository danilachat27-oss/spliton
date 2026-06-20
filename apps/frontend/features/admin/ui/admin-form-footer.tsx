"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminFormFooterProps = {
  left?: ReactNode;
  right: ReactNode;
  className?: string;
};

export function AdminFormFooter({ left, right, className }: AdminFormFooterProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 sm:flex-row sm:items-center",
        left ? "sm:justify-between" : "sm:justify-end",
        className,
      )}
    >
      {left ? <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div> : null}
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">{right}</div>
    </div>
  );
}

export function AdminFormFooterActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>{children}</div>
  );
}
