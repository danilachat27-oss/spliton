"use client";

import { Button } from "@/components/ui/button";
import {
  adminAccentBg,
  adminBtnGhost,
  adminBtnSecondary,
} from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminActionButtonProps = React.ComponentProps<typeof Button> & {
  tone?: "primary" | "secondary" | "ghost" | "danger";
};

export function AdminActionButton({
  tone = "secondary",
  className,
  variant,
  ...props
}: AdminActionButtonProps) {
  const resolvedVariant =
    variant ??
    (tone === "danger" ? "destructive" : tone === "primary" ? "default" : "outline");

  const toneClass =
    tone === "primary"
      ? adminAccentBg
      : tone === "ghost"
        ? adminBtnGhost
        : tone === "secondary"
          ? adminBtnSecondary
          : undefined;

  return (
    <Button
      variant={resolvedVariant}
      className={cn(toneClass, className)}
      {...props}
    />
  );
}