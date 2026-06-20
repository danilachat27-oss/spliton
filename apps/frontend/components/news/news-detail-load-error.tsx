"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ErrorState } from "@/components/shared/data-states/error-state";

type NewsDetailLoadErrorProps = {
  onRetry?: () => void;
};

export function NewsDetailLoadError({ onRetry }: NewsDetailLoadErrorProps) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-lg py-16">
      <ErrorState
        message={t("news.detail.error.load")}
        onRetry={onRetry}
        retryLabel={t("news.retry")}
        className="border-red-500/20 bg-red-500/5 text-red-200"
      />
      <div className="mt-6 text-center">
        <Link
          href="/news"
          className="inline-flex h-9 items-center justify-center rounded-md border border-white/15 bg-transparent px-4 text-sm font-medium text-white hover:bg-zinc-900"
        >
          {t("news.detail.error.backToList")}
        </Link>
      </div>
    </div>
  );
}
