"use client";

import * as React from "react";

import {
  AdminDrawerCancelButton,
  AdminDrawerPrimaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { AdminConfirmDialog } from "@/features/admin/ui/admin-confirm-dialog";
import { AdminFormFooterActions } from "@/features/admin/ui/admin-form-footer";
import { AdminRoleBadge } from "@/features/admin/ui/admin-role-badge";
import { STAFF_ROLE_CODES, type StaffRoleCode } from "@/features/admin/types/admin-roles";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

const SUPER_ADMIN_CONFIRM_TEXT =
  "Я понимаю, что назначаю полный доступ SUPER_ADMIN";

const ASSIGNABLE_STAFF: StaffRoleCode[] = STAFF_ROLE_CODES.filter(
  (r) => r !== "SUPPORT" && r !== "ADMIN",
);

type AdminRoleAssignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  currentRoles: string[];
  onAssign: (role: StaffRoleCode, confirmSuperAdmin?: boolean) => void | Promise<void>;
};

export function AdminRoleAssignDialog({
  open,
  onOpenChange,
  userEmail,
  currentRoles,
  onAssign,
}: AdminRoleAssignDialogProps) {
  const a = useAdminI18n();
  const [selected, setSelected] = React.useState<StaffRoleCode>("ACCOUNTANT");
  const [confirm, setConfirm] = React.useState(false);
  const [superConfirmText, setSuperConfirmText] = React.useState("");

  const needsSuperConfirm = selected === "SUPER_ADMIN";
  const superConfirmOk =
    !needsSuperConfirm || superConfirmText.trim() === SUPER_ADMIN_CONFIRM_TEXT;

  React.useEffect(() => {
    if (!open) {
      setSuperConfirmText("");
      setConfirm(false);
    }
  }, [open]);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">Назначить роль сотрудника</h3>
            <p className="mt-1 text-sm text-zinc-500">{userEmail}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {currentRoles.map((r) => (
                <AdminRoleBadge key={r} role={r} />
              ))}
            </div>
            <AdminStyledSelectField
              label={a.t("admin.field.role")}
              className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500"
              value={selected}
              options={ASSIGNABLE_STAFF.map((code) => ({
                value: code,
                label: a.adminRoleLabel(code) ?? code,
              }))}
              onChange={(value) => {
                setSelected(value as StaffRoleCode);
                setSuperConfirmText("");
              }}
            />
            {needsSuperConfirm ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">Подтверждение SUPER_ADMIN</p>
                <p className="mt-1 text-xs text-amber-800">
                  Введите точную фразу: «{SUPER_ADMIN_CONFIRM_TEXT}»
                </p>
                <Input
                  className="mt-2 bg-zinc-900/80"
                  value={superConfirmText}
                  onChange={(e) => setSuperConfirmText(e.target.value)}
                  placeholder={SUPER_ADMIN_CONFIRM_TEXT}
                />
              </div>
            ) : null}
            <AdminFormFooterActions className="mt-6">
              <AdminDrawerCancelButton onClick={() => onOpenChange(false)}>
                {a.actions.cancel}
              </AdminDrawerCancelButton>
              <AdminDrawerPrimaryButton
                disabled={needsSuperConfirm && !superConfirmOk}
                onClick={() => setConfirm(true)}
              >
                Продолжить
              </AdminDrawerPrimaryButton>
            </AdminFormFooterActions>
          </div>
        </div>
      ) : null}
      <AdminConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={a.t("admin.title.assignRole")}
        description={`Назначить роль «${a.adminRoleLabel(selected) ?? selected}» пользователю ${userEmail}? Действие будет записано в журнал.`}
        confirmLabel={a.actions.confirm}
        onConfirm={() => {
          void onAssign(selected, needsSuperConfirm ? true : undefined);
          onOpenChange(false);
        }}
      />
    </>
  );
}
