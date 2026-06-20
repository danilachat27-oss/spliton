import { cn } from "@/lib/utils";
import { adminCard, adminTableCell, adminTableHead } from "@/features/admin/lib/admin-ui";

export type AdminColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

type AdminDataTableProps<T> = {
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  /** Без рамки карточки — как лента на payouts/history */
  flat?: boolean;
};

export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = "Нет записей",
  className,
  flat = false,
}: AdminDataTableProps<T>) {
  return (
    <div
      className={cn(
        flat ? "overflow-hidden rounded-2xl bg-zinc-900/40" : adminCard("overflow-hidden p-0"),
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr
              className={cn(
                flat ? "bg-transparent" : "border-b border-zinc-800 bg-zinc-900/80",
              )}
            >
              {columns.map((col) => (
                <th key={col.key} className={cn("px-4 py-3", adminTableHead, col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-zinc-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    flat ? "border-b border-zinc-800/50 last:border-0" : "border-b border-zinc-800/40 last:border-0",
                    onRowClick && (flat ? "cursor-pointer hover:bg-zinc-800/50" : "cursor-pointer hover:bg-zinc-800/40"),
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 align-middle", adminTableCell, col.className)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
