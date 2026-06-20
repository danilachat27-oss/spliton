"use client";

import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-[#B7F500]/20 text-[#B7F500] ring-1 ring-[#B7F500]/30",
  ADMIN: "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-600",
  ACCOUNTANT: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
  CONTENT_MANAGER: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25",
  SUPPORT_MANAGER: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/25",
  COMPLIANCE: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  SUPPORT: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/25",
  INVESTOR: "bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-700",
  ARTIST: "bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-700",
  USER: "bg-zinc-800/80 text-zinc-500",
};

type AdminRoleBadgeProps = {
  role: string;
  className?: string;
};

export function AdminRoleBadge({ role, className }: AdminRoleBadgeProps) {
  const a = useAdminI18n();

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        ROLE_STYLES[role] ?? "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700",
        className,
      )}
    >
      {a.adminRoleLabel(role) ?? role}
    </span>
  );
}
