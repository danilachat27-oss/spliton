"use client";

import { useAuth } from "@/components/providers/auth-provider";
import type { PermissionArea } from "@/features/admin/config/admin-permissions";
import {
  canAssignUserRoles,
  canBlockUsers,
  canPerformAdminAction,
  canRemoveUserRoles,
  canPatchPlatformFees,
  getPermissionLevel,
  isReadOnlyAdminArea,
  type AdminAction,
} from "@/features/admin/lib/admin-action-permissions";

export function useAdminPermissions() {
  const { user } = useAuth();
  const roles = user?.roles;

  return {
    level: (area: PermissionArea) => getPermissionLevel(roles, area),
    can: (area: PermissionArea, action: AdminAction) =>
      canPerformAdminAction(roles, area, action),
    readOnly: (area: PermissionArea) => isReadOnlyAdminArea(roles, area),
    canAssignRoles: () => canAssignUserRoles(roles),
    canRemoveRoles: () => canRemoveUserRoles(roles),
    canBlockUsers: () => canBlockUsers(roles),
    canPatchPlatformFees: () => canPatchPlatformFees(roles),
  };
}
