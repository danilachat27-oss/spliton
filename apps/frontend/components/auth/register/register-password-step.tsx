"use client";

import * as React from "react";
import Link from "next/link";

import { authFieldClassName } from "@/components/auth/auth-field-classes";
import { PasswordTrackToggle } from "@/components/auth/password-track-toggle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/auth-messages";
import { cn } from "@/lib/utils";

export type RegisterPasswordStepProps = {
  fieldStyle: React.CSSProperties;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  trimmedEmail: string;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean | ((prev: boolean) => boolean)) => void;
  trackPlaying: boolean;
  errors: {
    password?: string;
    confirmPassword?: string;
    terms?: string;
    submit?: string;
  };
  clearError: (key: "password" | "confirmPassword" | "terms") => void;
  isSubmitting: boolean;
  duplicateEmailConflict: boolean;
  isResendingExistingEmail: boolean;
  onResendExistingEmail: () => Promise<void>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBackToEmail: () => void;
};

export function RegisterPasswordStep({
  fieldStyle,
  passwordRef,
  trimmedEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  termsAccepted,
  setTermsAccepted,
  showPassword,
  setShowPassword,
  trackPlaying,
  errors,
  clearError,
  isSubmitting,
  duplicateEmailConflict,
  isResendingExistingEmail,
  onResendExistingEmail,
  onSubmit,
  onBackToEmail,
}: RegisterPasswordStepProps) {
  const { t } = useI18n();
  return (
    <>
      <button
        type="button"
        onClick={onBackToEmail}
        className="mb-4 text-left text-xs font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-900 hover:decoration-neutral-900"
      >
        {t("auth.register.changeEmail")}
      </button>

      <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
        {t("auth.register.passwordTitle")}
      </h2>
      <p className="mt-2 text-[14px] leading-snug text-neutral-600">
        {tf(t("auth.register.passwordBody"), { email: trimmedEmail })}
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="register-password" className="sr-only">
            {t("auth.login.password")}
          </Label>
          <div className="relative">
            <Input
              ref={passwordRef}
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("auth.login.password")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
                clearError("confirmPassword");
              }}
              className={cn(authFieldClassName, "pr-[52px]")}
              style={fieldStyle}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "register-password-error" : undefined}
            />
            <PasswordTrackToggle
              showPassword={showPassword}
              isPlaying={trackPlaying}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
          {errors.password ? (
            <p
              id="register-password-error"
              className="text-[13px] font-medium leading-snug text-rose-800"
            >
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm" className="sr-only">
            {t("auth.register.confirmPassword")}
          </Label>
          <Input
            id="register-confirm"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("auth.register.confirmPassword")}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearError("confirmPassword");
            }}
            className={authFieldClassName}
            style={fieldStyle}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "register-confirm-error" : undefined
            }
          />
          {errors.confirmPassword ? (
            <p
              id="register-confirm-error"
              className="text-[13px] font-medium leading-snug text-rose-800"
            >
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex gap-2">
            <Checkbox
              id="register-terms"
              checked={termsAccepted}
              onCheckedChange={(v) => {
                setTermsAccepted(Boolean(v));
                clearError("terms");
              }}
              className="mt-[3px] shrink-0"
              aria-invalid={Boolean(errors.terms)}
              aria-describedby={errors.terms ? "register-terms-error" : undefined}
            />
            <Label
              htmlFor="register-terms"
              className="min-w-0 flex-1 cursor-pointer text-[11px] font-normal leading-snug text-pretty text-neutral-400"
            >
              {t("auth.register.termsPrefix")}{" "}
              <Link
                href={ROUTES.terms}
                className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
              >
                {t("auth.register.termsLink")}
              </Link>{" "}
              {t("auth.register.termsAnd")}{" "}
              <Link
                href={ROUTES.privacy}
                className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
              >
                {t("auth.register.privacyLink")}
              </Link>
              .
            </Label>
          </div>
          {errors.terms ? (
            <p
              id="register-terms-error"
              className="pl-6 text-[11px] font-medium leading-snug text-rose-800"
            >
              {errors.terms}
            </p>
          ) : null}
        </div>

        {errors.submit ? (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-medium leading-snug text-rose-900"
          >
            {errors.submit}
          </p>
        ) : null}

        {duplicateEmailConflict ? (
          <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
            <p className="text-[13px] leading-snug text-neutral-700">{t("auth.register.duplicateHint")}</p>
            <Button
              type="button"
              className="h-[44px] w-full rounded-xl border border-neutral-900 bg-neutral-900 text-[14px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px disabled:opacity-50"
              disabled={isResendingExistingEmail}
              onClick={() => {
                void onResendExistingEmail();
              }}
            >
              {isResendingExistingEmail
                ? t("auth.register.resendExistingSending")
                : t("auth.register.resendExisting")}
            </Button>
            <Link
              href={ROUTES.login}
              className="inline-flex h-[44px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
            >
              {t("auth.register.goToLogin")}
            </Link>
          </div>
        ) : null}

        <Button
          type="submit"
          className="mt-1 h-[52px] w-full rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("auth.register.continueSending") : t("auth.register.createAccount")}
        </Button>
      </form>

      <p className="mt-6 text-center text-[15px] text-neutral-600">
        {t("auth.register.hasAccount")}{" "}
        <Link
          href={ROUTES.login}
          className="font-semibold text-neutral-900 underline decoration-neutral-900 underline-offset-4"
        >
          {t("auth.register.signIn")}
        </Link>
      </p>
    </>
  );
}
