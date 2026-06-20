"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AdminFormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
};

/** Consistent label → control → helper/error spacing for admin forms. */
export function AdminFormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: AdminFormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-zinc-200">
        {label}
      </Label>
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
