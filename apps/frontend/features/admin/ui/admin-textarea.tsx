"use client";

import type { ComponentProps } from "react";

import { adminFieldTextarea } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminTextareaProps = ComponentProps<"textarea">;

export function AdminTextarea({ className, ...props }: AdminTextareaProps) {
  return <textarea className={cn(adminFieldTextarea, className)} {...props} />;
}