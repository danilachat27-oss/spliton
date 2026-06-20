"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AUTH_FIELD_BORDER, authFieldClassName } from "@/components/auth/auth-field-classes";
import { GoogleMark } from "@/components/auth/google-mark";
import { PasswordTrackToggle } from "@/components/auth/password-track-toggle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatApiError } from "@/lib/i18n/format-api-error";
import { ApiError, signInWithGoogle } from "@/services/auth.service";
import { cn } from "@/lib/utils";

function resolveSafeNextPath(raw: string | null): string {
  if (!raw) return ROUTES.dashboard;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  } catch {
    /* ignore malformed */
  }
  return ROUTES.dashboard;
}

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveSafeNextPath(searchParams.get("next"));
  const { locale, t } = useI18n();
  const { login, verify2fa, pendingTwoFactorChallenge, resendEmail, isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    router.replace(nextPath);
  }, [isAuthenticated, isLoading, nextPath, router]);
  const [remember, setRemember] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordValue, setPasswordValue] = React.useState("");
  const [twoFactorCode, setTwoFactorCode] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [emailValue, setEmailValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResendingVerification, setIsResendingVerification] = React.useState(false);
  const [showResendVerification, setShowResendVerification] = React.useState(false);

  const trackPlaying = !showPassword && passwordValue.length > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setEmailValue(email);

    setErrorMessage(null);
    setShowResendVerification(false);
    setIsSubmitting(true);
    try {
      const result = await login({ email, password, remember });
      setEmailValue(email);
      if (result !== "2fa_required") {
        router.push(nextPath);
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        setShowResendVerification(true);
        setErrorMessage(formatApiError({ code: "EMAIL_NOT_VERIFIED" }, locale));
      } else {
        setErrorMessage(formatApiError(error, locale));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onVerifyTwoFactor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pendingTwoFactorChallenge) {
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await verify2fa({
        challengeId: pendingTwoFactorChallenge.challengeId,
        code: twoFactorCode.trim(),
        method: "totp",
      });
      setTwoFactorCode("");
      router.push(nextPath);
    } catch (error) {
      setErrorMessage(formatApiError(error, locale));
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldStyle = { borderColor: AUTH_FIELD_BORDER } as React.CSSProperties;

  return (
    <div className={cn("w-full text-neutral-900", className)}>
      <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
        {t("auth.login.title")}
      </h2>

      {!pendingTwoFactorChallenge ? (
      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email" className="sr-only">
            {t("auth.login.emailLabel")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t("auth.login.email")}
            className={authFieldClassName}
            style={fieldStyle}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="sr-only">
            {t("auth.login.passwordLabel")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("auth.login.password")}
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              className={cn(authFieldClassName, "pr-[52px]")}
              style={fieldStyle}
              required
            />
            <PasswordTrackToggle
              showPassword={showPassword}
              isPlaying={trackPlaying}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setRemember(Boolean(v))}
              id="remember"
            />
            <Label htmlFor="remember" className="text-sm font-normal text-neutral-600">
              {t("auth.login.remember")}
            </Label>
          </div>
          <Link
            href={ROUTES.forgotPassword}
            className="text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
          >
            {t("auth.login.forgot")}
          </Link>
        </div>

        <Button
          type="submit"
          className="mt-2 h-[52px] w-full rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px disabled:opacity-50"
          disabled={isSubmitting}
        >
          {t("auth.login.submit")}
        </Button>
      </form>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={onVerifyTwoFactor}>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
            {t("auth.2fa.hint")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="twoFactorCode" className="sr-only">
              {t("auth.login.twoFactor")}
            </Label>
            <Input
              id="twoFactorCode"
              name="twoFactorCode"
              type="text"
              inputMode="numeric"
              placeholder={t("auth.2fa.codePlaceholder")}
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className={authFieldClassName}
              style={fieldStyle}
              required
            />
          </div>
          <Button
            type="submit"
            className="mt-2 h-[52px] w-full rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px disabled:opacity-50"
            disabled={isSubmitting}
          >
            {t("auth.2fa.submit")}
          </Button>
        </form>
      )}

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
          {showResendVerification && emailValue ? (
            <button
              type="button"
              className="ml-2 underline underline-offset-2"
              onClick={async () => {
                setIsResendingVerification(true);
                try {
                  await resendEmail(emailValue);
                  const next = new URLSearchParams();
                  next.set("email", emailValue);
                  router.push(`${ROUTES.verifyEmail}?${next.toString()}`);
                } catch {
                  setErrorMessage(t("auth.login.resendFailed"));
                } finally {
                  setIsResendingVerification(false);
                }
              }}
              disabled={isResendingVerification}
            >
              {isResendingVerification ? t("auth.login.resendSending") : t("auth.login.resendAgain")}
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-8 text-center text-[15px] text-neutral-600">
        {t("auth.login.noAccount")}{" "}
        <Link
          href={ROUTES.register}
          className="font-semibold text-neutral-900 underline decoration-neutral-900 underline-offset-4"
        >
          {t("auth.login.register")}
        </Link>
      </p>

      <div className="relative mt-10 py-1">
        <Separator className="bg-neutral-200" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="bg-white px-3 text-xs font-medium text-neutral-500">
            {t("auth.login.altMethod")}
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch {
              /* Replace with toast when OAuth is wired. */
            }
          }}
        >
          <GoogleMark className="size-[18px] shrink-0" />
          {t("auth.login.google")}
        </button>
      </div>

      <p className="mt-10 text-center text-[11px] leading-relaxed text-neutral-400">
        {t("auth.login.legalPrefix")}{" "}
        <Link href={ROUTES.terms} className="text-neutral-600 underline underline-offset-2">
          {t("auth.login.termsLink")}
        </Link>{" "}
        {t("auth.login.legalAnd")}{" "}
        <Link href={ROUTES.privacy} className="text-neutral-600 underline underline-offset-2">
          {t("auth.login.privacyLink")}
        </Link>
        .
      </p>
    </div>
  );
}
