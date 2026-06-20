"use client";

import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import {
  AdminDataTable,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPagination,
  type AdminColumn,
} from "@/features/admin/ui";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import type { AdminBreadcrumbItem } from "@/features/admin/ui/admin-breadcrumbs";

type AdminListPageProps<T> = {
  title: string;
  description?: string;
  breadcrumbs: AdminBreadcrumbItem[];
  columns: AdminColumn<T>[];
  rowKey: (row: T) => string;
  loader: (query: AdminListQuery) => Promise<PaginatedResponse<T>>;
  filters?: React.ReactNode;
  headerActions?: React.ReactNode;
  onRowClick?: (row: T) => void;
  banner?: React.ReactNode;
  emptyMessage?: string;
};

/**
 * Standard operator list page: header + filters + table + pagination.
 */
export function AdminListPage<T>({
  title,
  description,
  breadcrumbs,
  columns,
  rowKey,
  loader,
  filters,
  headerActions,
  onRowClick,
  banner,
  emptyMessage,
}: AdminListPageProps<T>) {
  const { data, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={headerActions}
      />
      {banner}
      {filters}
      {loading ? <AdminLoadingState /> : null}
      {error ? <AdminErrorState onRetry={reload} /> : null}
      {!loading && !error ? (
        <div className="overflow-hidden rounded-2xl bg-zinc-900/45">
          <AdminDataTable
            columns={columns}
            rows={data.items}
            rowKey={rowKey}
            onRowClick={onRowClick}
            emptyMessage={emptyMessage}
            className="border-0 shadow-none rounded-none"
          />
          <AdminPagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
          />
        </div>
      ) : null}
    </AdminPageShell>
  );
}
