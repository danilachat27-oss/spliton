"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { ApiError, signInWithGoogle } from "@/services/auth.service";
import { cn } from "@/lib/utils";

const tabInactive =
  "cursor-default border-b-2 border-transparent pb-3 text-[15px] text-neutral-400";
const tabActive =
  "cursor-default border-b-2 border-neutral-900 pb-3 text-[15px] font-semibold text-neutral-900";

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const { login, verify2fa, pendingTwoFactorChallenge, resendEmail } = useAuth();
  const [remember, setRemember] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordValue, setPasswordValue] = React.useState("");
  const [twoFactorCode, setTwoFactorCode] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [emailValue, setEmailValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResendingVerification, setIsResendingVerification] = React.useState(false);

  const trackPlaying = !showPassword && passwordValue.length > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setEmailValue(email);

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const status = await login({ email, password, remember });
      setEmailValue(email);
      if (status === "authenticated") {
        router.push(ROUTES.dashboard);
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        setErrorMessage("Подтвердите email перед входом. Мы можем отправить письмо повторно.");
      } else {
        setErrorMessage("Неверный email или пароль.");
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
      router.push(ROUTES.dashboard);
    } catch {
      setErrorMessage("Неверный 2FA-код. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldStyle = { borderColor: AUTH_FIELD_BORDER } as React.CSSProperties;

  return (
    <div className={cn("w-full text-neutral-900", className)}>
      <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
        Войти
      </h2>

      <div
        className="mt-8 flex gap-8 border-b border-neutral-200"
        role="tablist"
        aria-label="Способ входа"
      >
        <span className={tabInactive} role="tab" aria-disabled="true">
          Телефон
        </span>
        <span className={tabActive} role="tab" aria-selected="true">
          Эл. почта
        </span>
        <span className={tabInactive} role="tab" aria-disabled="true">
          QR-код
        </span>
      </div>

      {!pendingTwoFactorChallenge ? (
      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email" className="sr-only">
            Электронная почта
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Эл. почта"
            className={authFieldClassName}
            style={fieldStyle}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="sr-only">
            Пароль
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Пароль"
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
              Запомнить меня
            </Label>
          </div>
          <Link
            href={ROUTES.forgotPassword}
            className="text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
          >
            Забыли пароль?
          </Link>
        </div>

        <Button
          type="submit"
          className="mt-2 h-[52px] w-full rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px disabled:opacity-50"
          disabled={isSubmitting}
        >
          Войти
        </Button>
      </form>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={onVerifyTwoFactor}>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
            Подтвердите вход: введите код из приложения-аутентификатора.
          </div>
          <div className="space-y-2">
            <Label htmlFor="twoFactorCode" className="sr-only">
              2FA код
            </Label>
            <Input
              id="twoFactorCode"
              name="twoFactorCode"
              type="text"
              inputMode="numeric"
              placeholder="6-значный код"
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
            Подтвердить вход
          </Button>
        </form>
      )}

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
          {errorMessage.includes("Подтвердите email") && emailValue ? (
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
                  setErrorMessage("Не удалось отправить письмо подтверждения. Попробуйте ещё раз.");
                } finally {
                  setIsResendingVerification(false);
                }
              }}
              disabled={isResendingVerification}
            >
              {isResendingVerification
                ? "Отправляем..."
                : "Отправить письмо ещё раз"}
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-8 text-center text-[15px] text-neutral-600">
        Нет аккаунта?{" "}
        <Link
          href={ROUTES.register}
          className="font-semibold text-neutral-900 underline decoration-neutral-900 underline-offset-4"
        >
          Зарегистрироваться
        </Link>
      </p>

      <div className="relative mt-10 py-1">
        <Separator className="bg-neutral-200" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="bg-white px-3 text-xs font-medium text-neutral-500">
            Альтернативный способ
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
              // Replace with toast when OAuth is wired.
            }
          }}
        >
          <GoogleMark className="size-[18px] shrink-0" />
          Google
        </button>
      </div>

      <p className="mt-10 text-center text-[11px] leading-relaxed text-neutral-400">
        Продолжая, вы принимаете{" "}
        <Link href={ROUTES.terms} className="text-neutral-600 underline underline-offset-2">
          условия
        </Link>{" "}
        и{" "}
        <Link href={ROUTES.privacy} className="text-neutral-600 underline underline-offset-2">
          конфиденциальность
        </Link>
        .
      </p>
    </div>
  );
}
