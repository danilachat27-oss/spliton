import { adminStatusToneClass } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export type AdminStatusTone = keyof typeof adminStatusToneClass;

type AdminStatusBadgeProps = {
  label: string;
  tone?: AdminStatusTone;
  className?: string;
};

export function AdminStatusBadge({
  label,
  tone = "neutral",
  className,
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        adminStatusToneClass[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
