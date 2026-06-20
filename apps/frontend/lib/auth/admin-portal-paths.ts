import { ROUTES } from "@/constants/routes";

/** Operator portal routes use `/admin/login`, not public `/login`. */
export function isAdminPortalPath(pathname: string): boolean {
  return (
    pathname === ROUTES.admin ||
    pathname === ROUTES.adminLogin ||
    pathname.startsWith(`${ROUTES.admin}/`)
  );
}
