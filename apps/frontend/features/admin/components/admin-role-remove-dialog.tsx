"use client";

import * as React from "react";

import {
  AdminDrawerCancelButton,
  AdminDrawerDangerButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { AdminStyledSelectField } from "@/features/admin/ui/admin-styled-select";
import { AdminConfirmDialog } from "@/features/admin/ui/admin-confirm-dialog";
import { AdminFormFooterActions } from "@/features/admin/ui/admin-form-footer";
import { AdminRoleBadge } from "@/features/admin/ui/admin-role-badge";
import { STAFF_ROLE_CODES, type StaffRoleCode } from "@/features/admin/types/admin-roles";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

const SUPER_ADMIN_CONFIRM_TEXT =
  "Я понимаю, что снимаю полный доступ SUPER_ADMIN";

type AdminRoleRemoveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  currentRoles: string[];
  onRemove: (role: string, confirmSuperAdmin?: boolean) => void | Promise<void>;
};

export function AdminRoleRemoveDialog({
  open,
  onOpenChange,
  userEmail,
  currentRoles,
  onRemove,
}: AdminRoleRemoveDialogProps) {
  const a = useAdminI18n();
  const removable = currentRoles.filter(
    (r) => STAFF_ROLE_CODES.includes(r as StaffRoleCode) || r === "INVESTOR" || r === "ARTIST" || r === "USER",
  );
  const [selected, setSelected] = React.useState(removable[0] ?? "");
  const [confirm, setConfirm] = React.useState(false);
  const [superConfirmText, setSuperConfirmText] = React.useState("");

  const needsSuperConfirm = selected === "SUPER_ADMIN";
  const superConfirmOk =
    !needsSuperConfirm || superConfirmText.trim() === SUPER_ADMIN_CONFIRM_TEXT;

  React.useEffect(() => {
    if (!open) {
      setSuperConfirmText("");
      setConfirm(false);
    } else if (removable[0]) {
      setSelected(removable[0]);
    }
  }, [open, removable]);

  if (!removable.length) return null;

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">Снять роль</h3>
            <p className="mt-1 text-sm text-zinc-500">{userEmail}</p>
            <AdminStyledSelectField
              label={a.t("admin.field.roleToRemove")}
              className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500"
              value={selected}
              options={removable.map((code) => ({
                value: code,
                label: a.adminRoleLabel(code as StaffRoleCode) ?? code,
              }))}
              onChange={(value) => {
                setSelected(value);
                setSuperConfirmText("");
              }}
            />
            {needsSuperConfirm ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-medium text-rose-900">Подтверждение снятия SUPER_ADMIN</p>
                <p className="mt-1 text-xs text-rose-800">
                  Введите: «{SUPER_ADMIN_CONFIRM_TEXT}»
                </p>
                <Input
                  className="mt-2 bg-zinc-900/80"
                  value={superConfirmText}
                  onChange={(e) => setSuperConfirmText(e.target.value)}
                />
              </div>
            ) : null}
            <AdminFormFooterActions className="mt-6">
              <AdminDrawerCancelButton onClick={() => onOpenChange(false)}>
                {a.actions.cancel}
              </AdminDrawerCancelButton>
              <AdminDrawerDangerButton
                disabled={!selected || (needsSuperConfirm && !superConfirmOk)}
                onClick={() => setConfirm(true)}
              >
                Продолжить
              </AdminDrawerDangerButton>
            </AdminFormFooterActions>
          </div>
        </div>
      ) : null}
      <AdminConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={a.t("admin.title.removeRole")}
        description={`Снять роль «${a.adminRoleLabel(selected as StaffRoleCode) ?? selected}» у ${userEmail}? Действие будет записано в журнал аудита.`}
        variant="destructive"
        confirmLabel="Снять роль"
        onConfirm={() => {
          void onRemove(selected, needsSuperConfirm ? true : undefined);
          onOpenChange(false);
        }}
      />
    </>
  );
}
