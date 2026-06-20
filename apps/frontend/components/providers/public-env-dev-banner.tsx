"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/financial-messages";
import {
  collectPublicEnvWarnings,
  getPublicApiBaseUrl,
  logPublicEnvWarnings,
  type PublicEnvWarning,
} from "@/lib/public-env";

const HEALTH_POLL_MS = 5_000;

function resolveWarningMessage(
  warning: PublicEnvWarning,
  t: (key: string) => string,
  apiBaseUrl: string,
): string {
  if (warning.code === "api_unreachable") {
    return tf(t("devEnv.banner.apiUnreachable"), { url: apiBaseUrl });
  }
  return warning.message;
}

export function PublicEnvDevBanner() {
  const { t } = useI18n();
  const [warnings, setWarnings] = useState<PublicEnvWarning[]>([]);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const apiBaseUrl = getPublicApiBaseUrl();

  const checkApiHealth = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/health`, {
        method: "GET",
        cache: "no-store",
      });
      setApiReachable(res.ok);
    } catch {
      setApiReachable(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    logPublicEnvWarnings();
    setWarnings(collectPublicEnvWarnings());

    void checkApiHealth();
    const id = window.setInterval(() => {
      void checkApiHealth();
    }, HEALTH_POLL_MS);

    const onFocus = () => {
      void checkApiHealth();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [checkApiHealth]);

  const allWarnings = [...warnings];
  if (apiReachable === false) {
    allWarnings.push({
      code: "api_unreachable",
      message: "",
    });
  }

  if (allWarnings.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-neutral-950/95 px-4 py-2.5 text-xs text-neutral-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
        <Link
          href={ROUTES.support}
          className="shrink-0 font-semibold text-[#B7F500] underline-offset-2 transition hover:text-[#c8f06a] hover:underline"
        >
          {t("devEnv.banner.contactSupport")}
        </Link>

        <div className="min-w-0 flex-1">
          <p className="font-semibold tracking-wide text-neutral-100">{t("devEnv.banner.title")}</p>
          <ul className="mt-1 space-y-0.5 text-neutral-300">
            {allWarnings.map((warning) => (
              <li key={warning.code}>- {resolveWarningMessage(warning, t, apiBaseUrl)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
