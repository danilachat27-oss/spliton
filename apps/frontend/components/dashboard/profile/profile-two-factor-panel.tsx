"use client";

import { useCallback, useState } from "react";
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
import { localizedApiError } from "@/lib/api/localized-error";
import { cn } from "@/lib/utils";
import {
  disableTwoFactor,
  extractTotpSecret,
  setupTwoFactor,
  verifyTwoFactorSetup,
} from "@/services/two-factor.service";

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
};

type Step = "idle" | "setup" | "backup" | "disable";

export function ProfileTwoFactorPanel({ enabled, onEnabledChange }: Props) {
  const { authorizedFetch } = useAuth();
  const { t, locale } = useI18n();
  const [step, setStep] = useState<Step>("idle");
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const secret = otpauthUrl ? extractTotpSecret(otpauthUrl) : null;

  const resetFlow = useCallback(() => {
    setStep("idle");
    setOtpauthUrl(null);
    setCode("");
    setPassword("");
    setBackupCodes([]);
    setError(null);
  }, []);

  const startSetup = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await setupTwoFactor(authorizedFetch);
      setOtpauthUrl(result.otpauthUrl);
      setStep("setup");
    } catch (e) {
      setError(localizedApiError(e, locale));
    } finally {
      setBusy(false);
    }
  }, [authorizedFetch, locale]);

  const confirmSetup = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await verifyTwoFactorSetup(authorizedFetch, code.trim());
      setBackupCodes(result.backupCodes);
      onEnabledChange(true);
      setStep("backup");
      setCode("");
    } catch (e) {
      setError(localizedApiError(e, locale));
    } finally {
      setBusy(false);
    }
  }, [authorizedFetch, code, locale, onEnabledChange]);

  const confirmDisable = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await disableTwoFactor(authorizedFetch, {
        password,
        code: code.trim(),
        method: "totp",
      });
      onEnabledChange(false);
      resetFlow();
    } catch (e) {
      setError(localizedApiError(e, locale));
    } finally {
      setBusy(false);
    }
  }, [authorizedFetch, code, locale, onEnabledChange, password, resetFlow]);

  const setupHints = [
    t("profile.security.twoFa.hint.scan"),
    t("profile.security.twoFa.hint.code"),
    t("profile.security.twoFa.hint.backup"),
  ];

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            enabled ? "bg-lime-100/90 text-lime-950" : "bg-neutral-200 text-neutral-700",
          )}
        >
          {enabled ? t("profile.security.twoFa.enabled") : t("profile.security.twoFa.disabled")}
        </span>
        {!enabled && step === "idle" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void startSetup()}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-lime-400 px-4 text-xs font-semibold text-neutral-950 transition hover:bg-lime-300 disabled:opacity-60"
          >
            {busy ? (
              <>
                <SplitonLoader size="xxs" variant="dark" className="mr-1.5 inline" />
                {t("profile.security.twoFa.preparing")}
              </>
            ) : (
              t("profile.security.twoFa.enable")
            )}
          </button>
        ) : null}
        {enabled && step !== "disable" ? (
          <button
            type="button"
            onClick={() => {
              setStep("disable");
              setError(null);
            }}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-100 px-4 text-xs font-semibold text-neutral-800"
          >
            {t("profile.security.twoFa.disable")}
          </button>
        ) : null}
      </div>

      {error && step === "idle" ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ProfileSecurityModal
        open={step === "setup"}
        onOpenChange={(open) => {
          if (!open) resetFlow();
        }}
        eyebrow={t("profile.security.twoFa.title")}
        title={t("profile.security.twoFa.setupTitle")}
        footer={
          <div className="space-y-2">
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={busy || code.length !== 6}
                onClick={() => void confirmSetup()}
                className={cn(
                  profilePrimaryButtonClass,
                  "h-10 flex-1 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60",
                )}
              >
                {busy ? (
                  <>
                    <SplitonLoader size="xxs" variant="dark" className="mr-2 inline" />
                    {t("profile.security.twoFa.confirming")}
                  </>
                ) : (
                  t("profile.security.twoFa.confirm")
                )}
              </button>
              <button
                type="button"
                onClick={() => resetFlow()}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#F5F5F5] text-sm font-semibold text-neutral-900 transition hover:bg-[#EBEBEB]"
              >
                {t("profile.security.password.cancel")}
              </button>
            </div>
          </div>
        }
      >
        {secret ? (
          <p className="mb-3 break-all rounded-xl bg-[#F5F5F5] px-3 py-2 font-mono text-xs text-neutral-700">
            {t("profile.security.twoFa.secret")}: {secret}
          </p>
        ) : null}
        {otpauthUrl ? (
          <a
            href={otpauthUrl}
            className="mb-4 inline-block text-xs font-semibold text-neutral-800 underline underline-offset-2"
          >
            {t("profile.security.twoFa.openOtpauth")}
          </a>
        ) : null}
        <ProfileSecurityModalFieldList>
          <ProfileSecurityModalField label={t("profile.security.twoFa.codeLabel")} htmlFor="twofa-setup-code">
            <input
              id="twofa-setup-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={cn(profileModalInputClass, "font-mono tracking-widest")}
              autoComplete="one-time-code"
            />
          </ProfileSecurityModalField>
        </ProfileSecurityModalFieldList>
        <ProfileSecurityModalHints items={setupHints} />
      </ProfileSecurityModal>

      <ProfileSecurityModal
        open={step === "backup" && backupCodes.length > 0}
        onOpenChange={(open) => {
          if (!open) resetFlow();
        }}
        eyebrow={t("profile.security.twoFa.title")}
        title={t("profile.security.twoFa.backupTitle")}
        description={t("profile.security.twoFa.backupHint")}
        footer={
          <button
            type="button"
            onClick={() => resetFlow()}
            className={cn(
              profilePrimaryButtonClass,
              "h-10 w-full bg-neutral-900 text-white hover:bg-neutral-800",
            )}
          >
            {t("profile.security.twoFa.done")}
          </button>
        }
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {backupCodes.map((item) => (
            <li key={item} className="rounded-lg bg-[#F5F5F5] px-3 py-2 font-mono text-xs text-neutral-800">
              {item}
            </li>
          ))}
        </ul>
      </ProfileSecurityModal>

      <ProfileSecurityModal
        open={step === "disable"}
        onOpenChange={(open) => {
          if (!open) {
            setPassword("");
            setCode("");
            setError(null);
            setStep("idle");
          }
        }}
        eyebrow={t("profile.security.twoFa.title")}
        title={t("profile.security.twoFa.disableTitle")}
        footer={
          <div className="space-y-2">
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={busy || !password || code.length !== 6}
                onClick={() => void confirmDisable()}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-red-700 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <SplitonLoader size="xxs" variant="dark" className="mr-2 inline" />
                    {t("profile.security.twoFa.disabling")}
                  </>
                ) : (
                  t("profile.security.twoFa.disableConfirm")
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPassword("");
                  setCode("");
                  setError(null);
                  setStep("idle");
                }}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#F5F5F5] text-sm font-semibold text-neutral-900 transition hover:bg-[#EBEBEB]"
              >
                {t("profile.security.password.cancel")}
              </button>
            </div>
          </div>
        }
      >
        <ProfileSecurityModalFieldList>
          <ProfileSecurityModalField label={t("profile.security.password.current")} htmlFor="twofa-disable-pwd">
            <input
              id="twofa-disable-pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={profileModalInputClass}
            />
          </ProfileSecurityModalField>
          <ProfileSecurityModalField label={t("profile.security.twoFa.codeLabel")} htmlFor="twofa-disable-code">
            <input
              id="twofa-disable-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={cn(profileModalInputClass, "font-mono tracking-widest")}
              autoComplete="one-time-code"
            />
          </ProfileSecurityModalField>
        </ProfileSecurityModalFieldList>
      </ProfileSecurityModal>
    </>
  );
}
