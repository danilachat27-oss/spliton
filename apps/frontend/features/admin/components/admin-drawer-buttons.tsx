"use client";

import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "@/lib/lucide";
import { Loader2 } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import {
  adminAccentBg,
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

const DRAWER_ACTION_TONE = {
  cancel: adminBtnOutline,
  secondary: adminBtnSecondary,
  primary: cn(adminAccentBg, "font-semibold"),
  danger: "bg-red-950/40 text-red-300 hover:bg-red-950/60 hover:text-red-200",
  ghost: adminBtnGhost,
} as const;

type DrawerActionTone = keyof typeof DRAWER_ACTION_TONE;

type AdminDrawerActionButtonProps = Omit<BtnProps, "variant"> & {
  icon: LucideIcon;
  label: string;
  tone?: DrawerActionTone;
  loading?: boolean;
  /** Показывать подпись рядом с иконкой на широких экранах */
  showLabelFrom?: "never" | "lg" | "xl" | "always";
};

/** Компактная кнопка drawer: иконка + tooltip, подпись опционально на xl. */
export function AdminDrawerActionButton({
  icon: Icon,
  label,
  tone = "secondary",
  loading = false,
  showLabelFrom = "xl",
  className,
  children,
  title,
  disabled,
  ...props
}: AdminDrawerActionButtonProps) {
  const text = children ?? label;
  const labelClass =
    showLabelFrom === "always"
      ? "inline"
      : showLabelFrom === "never"
        ? "sr-only"
        : cn("sr-only", `${showLabelFrom}:not-sr-only`);

  return (
    <Button
      type="button"
      variant={tone === "primary" ? "default" : "ghost"}
      disabled={disabled || loading}
      className={cn(
        "size-9 min-h-9 shrink-0 gap-1.5 px-0 text-sm font-medium leading-none sm:h-9 sm:min-w-9 sm:px-2.5",
        "inline-flex items-center justify-center [&_svg]:size-4",
        showLabelFrom !== "never" && showLabelFrom !== "always" && `${showLabelFrom}:px-3`,
        showLabelFrom === "always" && "px-3",
        DRAWER_ACTION_TONE[tone],
        className,
      )}
      aria-label={label}
      title={title ?? label}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      )}
      <span className={labelClass}>{text}</span>
    </Button>
  );
}

export function AdminDrawerFooterToolbar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
