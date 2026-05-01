"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";

type VerifyStatus = "idle" | "loading" | "success" | "error";

export function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const { verifyEmail, resendEmail } = useAuth();
  const token = searchParams.get("token")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? "";

  const [status, setStatus] = React.useState<VerifyStatus>(token ? "loading" : "idle");
  const [message, setMessage] = React.useState<string>(
    token ? "Подтверждаем email..." : "Проверьте почту и перейдите по ссылке из письма.",
  );
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (!token) {
      return;
    }
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

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16 text-neutral-900">
      <h1 className="text-3xl font-semibold">Подтверждение email</h1>
      <p className="mt-4 text-neutral-600">{message}</p>

      {status === "success" ? (
        <Link
          href={ROUTES.login}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white"
        >
          Перейти ко входу
        </Link>
      ) : null}

      {status !== "success" && email ? (
        <button
          type="button"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-900"
          disabled={isResending}
          onClick={async () => {
            setIsResending(true);
            try {
              await resendEmail(email);
              setMessage("Письмо отправлено повторно. Проверьте входящие сообщения.");
            } catch {
              setMessage("Не удалось отправить письмо повторно. Попробуйте позже.");
            } finally {
              setIsResending(false);
            }
          }}
        >
          Отправить письмо повторно
        </button>
      ) : null}
    </main>
  );
}
