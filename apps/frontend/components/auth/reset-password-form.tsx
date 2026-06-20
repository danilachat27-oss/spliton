"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { authFieldClassName } from "@/components/auth/auth-field-classes";
import { PasswordTrackToggle } from "@/components/auth/password-track-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { formatApiError } from "@/lib/i18n/format-api-error";
import { resetPasswordRequest } from "@/services/auth.service";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t("auth.validation.tokenInvalid"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.validation.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.validation.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
    } catch (err) {
      setError(formatApiError(err, locale) || t("auth.validation.resetLinkExpired"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="w-full text-neutral-900">
        <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
          {t("auth.reset.doneTitle")}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{t("auth.reset.doneBody")}</p>
        <Link
          href={ROUTES.login}
          className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white hover:bg-neutral-800"
        >
          {t("auth.reset.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full text-neutral-900">
      <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
        {t("auth.reset.title")}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{t("auth.reset.body")}</p>

      {!token ? (
        <div className="mt-8 space-y-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {t("auth.reset.invalidToken")}
          </p>
          <Link
            href={ROUTES.forgotPassword}
            className="inline-flex text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
          >
            {t("auth.reset.requestLink")}
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium text-neutral-800">
              {t("auth.reset.newPassword")}
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(authFieldClassName, "pr-[52px]")}
                required
              />
              <PasswordTrackToggle
                showPassword={showPassword}
                isPlaying={false}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-neutral-800">
              {t("auth.reset.confirmPassword")}
            </Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={authFieldClassName}
              required
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <Button
            type="submit"
            className="mt-2 h-[52px] w-full rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px disabled:opacity-50"
            disabled={isSubmitting}
          >
            {t("auth.reset.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}
