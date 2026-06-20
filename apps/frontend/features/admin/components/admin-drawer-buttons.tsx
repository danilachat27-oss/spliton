"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  adminBtnGhost,
  adminBtnOutline,
  adminBtnPrimary,
  adminBtnSecondary,
} from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type BtnProps = ComponentProps<typeof Button>;

export function AdminDrawerCancelButton({ className, ...props }: BtnProps) {
  return <Button type="button" variant="ghost" className={cn(adminBtnOutline, className)} {...props} />;
}

export function AdminDrawerSecondaryButton({ className, ...props }: BtnProps) {
  return <Button type="button" variant="ghost" className={cn(adminBtnSecondary, className)} {...props} />;
}

export function AdminDrawerGhostButton({ className, ...props }: BtnProps) {
  return <Button type="button" variant="ghost" className={cn(adminBtnGhost, className)} {...props} />;
}

export function AdminDrawerPrimaryButton({ className, ...props }: BtnProps) {
  return <Button type="button" className={cn(adminBtnPrimary, className)} {...props} />;
}

export function AdminDrawerDangerButton({ className, ...props }: BtnProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-9 min-h-9 shrink-0 gap-1.5 px-4 text-sm font-medium leading-none inline-flex items-center justify-center",
        "bg-red-950/40 text-red-300 hover:bg-red-950/60 hover:text-red-200",
        className,
      )}
      {...props}
    />
  );
}
