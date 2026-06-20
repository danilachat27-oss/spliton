"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/auth-messages";

type VerifyStatus = "idle" | "loading" | "success" | "error";

export function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const { verifyEmail, resendEmail } = useAuth();
  const { t } = useI18n();
  const token = searchParams.get("token")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? "";

  const [status, setStatus] = React.useState<VerifyStatus>(token ? "loading" : "idle");
  const [message, setMessage] = React.useState<string>("");
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        await verifyEmail(token);
        if (!active) return;
        setStatus("success");
        setMessage(t("auth.verify.successBody"));
      } catch {
        if (!active) return;
        setStatus("error");
        setMessage(t("auth.verify.errorBody"));
      }
    })();
    return () => {
      active = false;
    };
  }, [token, verifyEmail, t]);

  const hasEmail = Boolean(email);

  async function handleResend(): Promise<void> {
    if (!hasEmail) return;
    setIsResending(true);
    try {
      await resendEmail(email);
      setMessage(t("auth.verify.resendSuccess"));
    } catch {
      setMessage(t("auth.verify.resendFailed"));
    } finally {
      setIsResending(false);
    }
  }

  const title =
    status === "loading"
      ? t("auth.verify.loadingTitle")
      : status === "success"
        ? t("auth.verify.successTitle")
        : status === "error"
          ? t("auth.verify.errorTitle")
          : hasEmail
            ? t("auth.verify.checkInboxTitle")
            : t("auth.verify.defaultTitle");

  const bodyText =
    status === "loading"
      ? t("auth.verify.loadingBody")
      : status === "success"
        ? t("auth.verify.successBody")
        : status === "error"
          ? t("auth.verify.errorBody")
          : hasEmail
            ? tf(t("auth.verify.checkInboxBody"), { email })
            : t("auth.verify.defaultBody");

  return (
    <div className="w-full text-neutral-900">
      <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
        {title}
      </h2>
      <p className="mt-6 text-[15px] leading-relaxed text-neutral-600">{bodyText}</p>

      {message ? (
        <p className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          {message}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        {status !== "success" && hasEmail ? (
          <Button
            type="button"
            className="h-[52px] w-full rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px disabled:opacity-50"
            onClick={handleResend}
            disabled={isResending || status === "loading"}
          >
            {isResending ? t("auth.verify.resendSending") : t("auth.verify.resendAgain")}
          </Button>
        ) : null}

        {status === "success" ? (
          <Link
            href={ROUTES.login}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px"
          >
            {t("auth.reset.signIn")}
          </Link>
        ) : null}

        <Link
          href={ROUTES.login}
          className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          {t("auth.verify.backToLogin")}
        </Link>

        {!hasEmail && status !== "success" ? (
          <Link
            href={ROUTES.register}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            {t("auth.verify.goRegister")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
