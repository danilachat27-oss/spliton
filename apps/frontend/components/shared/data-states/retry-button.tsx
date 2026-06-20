"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type RetryButtonProps = {
  onClick: () => void;
  className?: string;
  label?: string;
};

export function RetryButton({
  onClick,
  className,
  label,
}: RetryButtonProps) {
  const { t } = useI18n();
  const text = label ?? t("actions.retry");
  return (
    <button
      type="button"
      className={cn("font-semibold underline underline-offset-2", className)}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
