import { cn } from "@/lib/utils";
import { adminCard, adminSkeleton } from "@/features/admin/lib/admin-ui";

type AdminSkeletonProps = {
  className?: string;
  rows?: number;
};

export function AdminSkeleton({ className, rows = 4 }: AdminSkeletonProps) {
  return (
    <div className={cn(adminCard("space-y-3 p-5"), className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(adminSkeleton, "h-3")}
          style={{ width: `${Math.max(40, 100 - i * 12)}%` }}
        />
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 px-4 py-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(adminSkeleton, "h-10 w-full rounded-xl")} />
      ))}
    </div>
  );
}