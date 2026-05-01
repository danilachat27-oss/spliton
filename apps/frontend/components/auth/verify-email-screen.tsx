"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";

type VerifyStatus = "idle" | "loading" | "success" | "error";

export function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const { verifyEmail, resendEmail } = useAuth();
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
        setMessage("Email успешно подтверждён. Теперь можно войти в аккаунт.");
      } catch {
        if (!active) return;
        setStatus("error");
        setMessage("Ссылка недействительна или истекла. Запросите новое письмо подтверждения.");
      }
    })();
    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  const hasEmail = Boolean(email);

  async function handleResend(): Promise<void> {
    if (!hasEmail) return;
    setIsResending(true);
    try {
      await resendEmail(email);
      setMessage(
        "Если аккаунт существует и email ещё не подтверждён, мы отправим новое письмо.",
      );
    } catch {
      setMessage("Не удалось отправить запрос. Попробуйте ещё раз чуть позже.");
    } finally {
      setIsResending(false);
    }
  }

  const title =
    status === "loading"
      ? "Подтверждаем email"
      : status === "success"
        ? "Email подтверждён"
        : status === "error"
          ? "Ссылка недействительна или устарела"
          : hasEmail
            ? "Проверьте почту"
            : "Подтверждение email";

  const bodyText =
    status === "loading"
      ? "Проверяем ссылку подтверждения..."
      : status === "success"
        ? "Email успешно подтверждён. Теперь можно войти в аккаунт."
        : status === "error"
          ? "Срок действия ссылки мог истечь. Запросите новое письмо подтверждения."
          : hasEmail
            ? `Мы отправили ссылку подтверждения на ${email}.`
            : "Откройте ссылку из письма или войдите в аккаунт, чтобы запросить письмо повторно.";

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
            {isResending ? "Отправляем..." : "Отправить письмо ещё раз"}
          </Button>
        ) : null}

        {status === "success" ? (
          <Link
            href={ROUTES.login}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px"
          >
            Войти
          </Link>
        ) : null}

        <Link
          href={ROUTES.login}
          className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          Вернуться ко входу
        </Link>

        {!hasEmail && status !== "success" ? (
          <Link
            href={ROUTES.register}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            Перейти к регистрации
          </Link>
        ) : null}
      </div>
    </div>
  );
}
