"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

type LocalizedErrorScreenProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function LocalizedErrorScreen({ error, reset }: LocalizedErrorScreenProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[spliton-ui-error]", error.message);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">{t("errors.page.title")}</h1>
      <p className="max-w-md text-sm text-neutral-600">{t("errors.page.description")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          {t("errors.page.retry")}
        </Button>
        <Link
          href={ROUTES.dashboard}
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          {t("errors.page.goHome")}
        </Link>
      </div>
    </div>
  );
}
