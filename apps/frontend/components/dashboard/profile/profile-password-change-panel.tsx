"use client";

import { useCallback, useEffect, useState } from "react";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import {
  ProfileSecurityModal,
  ProfileSecurityModalField,
  ProfileSecurityModalFieldList,
  ProfileSecurityModalHints,
} from "@/components/dashboard/profile/profile-security-modal";
import { profileModalInputClass, profilePrimaryButtonClass } from "@/components/dashboard/profile/profile-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { changeUserPassword } from "@/services/user-me.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ProfilePasswordChangePanel({ open, onOpenChange, onSuccess }: Props) {
  const { authorizedFetch } = useAuth();
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }, []);

  const close = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const submit = useCallback(async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError(t("profile.security.password.error.tooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("profile.security.password.error.mismatch"));
      return;
    }
    setBusy(true);
    try {
      await changeUserPassword(authorizedFetch, { currentPassword, newPassword });
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      const key = e instanceof Error ? e.message : "profile.security.password.error.generic";
      setError(key.startsWith("profile.") ? t(key) : key);
    } finally {
      setBusy(false);
    }
  }, [
    authorizedFetch,
    confirmPassword,
    currentPassword,
    newPassword,
    onOpenChange,
    onSuccess,
    reset,
    t,
  ]);

  const hints = [
    t("profile.security.password.hint.minLength"),
    t("profile.security.password.hint.unique"),
    t("profile.security.password.hint.sessions"),
  ];

  return (
    <ProfileSecurityModal
      open={open}
      onOpenChange={close}
      eyebrow={t("profile.security.password.title")}
      title={t("profile.security.password.changeTitle")}
      description={t("profile.security.password.changeDescription")}
      footer={
        <div className="space-y-2">
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={busy || !currentPassword || !newPassword || !confirmPassword}
              onClick={() => void submit()}
              className={cn(
                profilePrimaryButtonClass,
                "h-10 flex-1 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60",
              )}
            >
              {busy ? (
                <>
                  <SplitonLoader size="xxs" variant="dark" className="mr-2 inline" />
                  {t("profile.security.password.submitting")}
                </>
              ) : (
                t("profile.security.password.submit")
              )}
            </button>
            <button
              type="button"
              onClick={() => close(false)}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#F5F5F5] text-sm font-semibold text-neutral-900 transition hover:bg-[#EBEBEB]"
            >
              {t("profile.security.password.cancel")}
            </button>
          </div>
        </div>
      }
    >
      <ProfileSecurityModalFieldList>
        <ProfileSecurityModalField label={t("profile.security.password.current")} htmlFor="pwd-current">
          <input
            id="pwd-current"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className={profileModalInputClass}
          />
        </ProfileSecurityModalField>
        <ProfileSecurityModalField label={t("profile.security.password.new")} htmlFor="pwd-new">
          <input
            id="pwd-new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className={profileModalInputClass}
          />
        </ProfileSecurityModalField>
        <ProfileSecurityModalField label={t("profile.security.password.confirm")} htmlFor="pwd-confirm">
          <input
            id="pwd-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className={profileModalInputClass}
          />
        </ProfileSecurityModalField>
      </ProfileSecurityModalFieldList>
      <ProfileSecurityModalHints items={hints} />
    </ProfileSecurityModal>
  );
}
