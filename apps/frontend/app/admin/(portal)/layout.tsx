import { AdminLayoutClient } from "@/features/admin/components/admin-layout-client";

/** Protected operator shell: sidebar, header, RBAC gate. */
export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}