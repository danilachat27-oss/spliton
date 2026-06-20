import { cn } from "@/lib/utils";
import { adminCard } from "@/features/admin/lib/admin-ui";

type AdminSectionCardProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function AdminSectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: AdminSectionCardProps) {
  return (
    <section className={cn(adminCard("overflow-hidden"), className)}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/80 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
