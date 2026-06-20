import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/** Legacy path → `/admin/audit-log` */
export default function AdminAuditLegacyRedirect() {
  redirect(ROUTES.adminAudit);
}
