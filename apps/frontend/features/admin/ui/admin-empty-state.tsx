import type { LucideIcon } from "@/lib/lucide";
import { Inbox } from "@/lib/lucide";

import { adminCard } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div className={cn(adminCard("flex flex-col items-center px-6 py-16 text-center"), className)}>
      <Icon className="size-10 text-zinc-400" aria-hidden />
      <h3 className="mt-4 text-base font-semibold text-zinc-100">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-zinc-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
