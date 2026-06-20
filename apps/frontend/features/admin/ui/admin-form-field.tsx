"use client";

import type { ReactNode } from "react";

import { Info } from "@/lib/lucide";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AdminFormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  /** Longer explanation shown via (i) icon next to the label. */
  info?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
};

export function AdminFieldInfo({ text }: { text: string }) {
  return (
    <button
      type="button"
      tabIndex={0}
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/40"
      title={text}
      aria-label={text}
    >
      <Info className="size-3.5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}

/** Consistent label → control → helper/error spacing for admin forms. */
export function AdminFormField({
  label,
  htmlFor,
  hint,
  info,
  error,
  children,
  className,
}: AdminFormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-zinc-200">
          {label}
        </Label>
        {info ? <AdminFieldInfo text={info} /> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {hint && !error ? (
        typeof hint === "string" ? (
          <p className="text-[11px] leading-relaxed text-zinc-500">{hint}</p>
        ) : (
          hint
        )
      ) : null}
    </div>
  );
}
