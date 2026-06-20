import { adminPageBg } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminPageShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Ограничить ширину как у кабинета / каталога (1400px). */
  contained?: boolean;
};

export function AdminPageShell({ children, className, contained }: AdminPageShellProps) {
  return (
    <div className={cn(adminPageBg, "min-h-full px-4 py-6 sm:px-6 lg:px-8", className)}>
      <div className={cn(contained && "mx-auto w-full max-w-[1400px]")}>{children}</div>
    </div>
  );
}
