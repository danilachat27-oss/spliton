"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminLoginFieldInput } from "@/features/admin/lib/admin-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { hasAdminAccess } from "@/features/admin/lib/admin-access";
import { markAdminAccessVerified } from "@/features/admin/lib/admin-access-cache";
import { verifyAdminAccess } from "@/services/admin.service";
import { ApiError, meRequest } from "@/services/auth.service";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { cn } from "@/lib/utils";

type AdminLoginFormState = "idle" | "loading" | "error" | "denied" | "2fa";

export function AdminLoginForm() {
  const a = useAdminI18n();
  const { messageFor } = useApiErrorMessage();
  const router = useRouter();
  const { login, verify2fa, pendingTwoFactorChallenge, logout } = useAuth();
  const [state, setState] = React.useState<AdminLoginFormState>("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = React.useState("");

  async function finishStaffGate(token: string | null) {
    if (!token) {
      setState("error");
      setMessage(a.t("admin.login.error.sessionFailed"));
      return;
    }
    let me = null;
    try {
      me = await meRequest(token);
    } catch {
      me = null;
    }
    if (!me || !hasAdminAccess(me.roles)) {
      setState("denied");
      setMessage(a.t("admin.login.error.noStaffRole"));
      return;
    }
    try {
      await verifyAdminAccess(token);
      markAdminAccessVerified(token);
      router.replace(ROUTES.admin);
    } catch {
      setState("denied");
      setMessage(a.t("admin.login.error.serverDenied"));
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setMessage(null);
    setState("loading");
    try {
      const tokenOr2fa = await login({ email, password, remember: true });
      if (tokenOr2fa === "2fa_required") {
        setState("2fa");
        return;
      }
      await finishStaffGate(tokenOr2fa);
    } catch (error) {
      setState("error");
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        setMessage(messageFor(error));
      } else if (error instanceof ApiError) {
        setMessage(messageFor(error));
      } else {
        setMessage(a.t("admin.login.error.invalidCredentials"));
      }
    } finally {
      setState((s) => (s === "loading" ? "idle" : s));
    }
  }

  async function onVerify2fa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pendingTwoFactorChallenge) return;
    setMessage(null);
    setState("loading");
    try {
      setTwoFactorCode("");
      const token = await verify2fa({
        challengeId: pendingTwoFactorChallenge.challengeId,
        code: twoFactorCode.trim(),
        method: "totp",
      });
      await finishStaffGate(token);
    } catch {
      setState("error");
      setMessage(a.t("admin.login.error.invalid2fa"));
    }
  }

  if (state === "denied") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">{a.t("admin.login.accessDeniedTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="ghost" className={adminBtnOutline}
            onClick={async () => {
              await logout();
              setState("idle");
              setMessage(null);
            }}
          >
            {a.t("admin.login.signOutOther")}
          </Button>
          <Link
            href={ROUTES.home}
            className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {a.t("admin.login.backToSite")}
          </Link>
        </div>
      </div>
    );
  }

  if (state === "2fa" || pendingTwoFactorChallenge) {
    return (
      <form onSubmit={onVerify2fa} className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">{a.t("admin.login.twoFactorTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{a.t("admin.login.twoFactorHint")}</p>
        </div>
        <div>
          <Label htmlFor="admin-2fa">{a.t("admin.login.codeLabel")}</Label>
          <Input
            id="admin-2fa"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            className={adminLoginFieldInput}
            autoComplete="one-time-code"
            inputMode="numeric"
          />
        </div>
        {message ? <p className="text-sm text-red-600">{message}</p> : null}
        <Button type="submit" className="w-full" disabled={state === "loading"}>
          {state === "loading" ? a.t("admin.login.verifying") : a.t("admin.login.continue")}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="admin-email">{a.t("admin.login.emailLabel")}</Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className={adminLoginFieldInput}
          disabled={state === "loading"}
        />
      </div>
      <div>
        <Label htmlFor="admin-password">{a.t("admin.login.passwordLabel")}</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={adminLoginFieldInput}
          disabled={state === "loading"}
        />
      </div>
      {message ? (
        <p className={cn("text-sm", state === "error" ? "text-red-600" : "text-zinc-600")}>
          {message}
        </p>
      ) : null}
      <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800" disabled={state === "loading"}>
        {state === "loading" ? a.t("admin.login.signingIn") : a.t("admin.login.signIn")}
      </Button>
    </form>
  );
}
