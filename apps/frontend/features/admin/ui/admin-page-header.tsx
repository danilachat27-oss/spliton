import { AdminBreadcrumbs, type AdminBreadcrumbItem } from "./admin-breadcrumbs";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: AdminBreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
};

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header className={cn("mb-6", className)}>
      {breadcrumbs?.length ? (
        <AdminBreadcrumbs items={breadcrumbs} className="mb-2" />
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h1>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
