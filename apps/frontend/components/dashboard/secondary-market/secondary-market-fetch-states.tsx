"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { SectionUnavailableState } from "@/components/shared/data-states/section-unavailable-state";
import { SplitonLoader } from "@/components/ui/spliton-loader";
import { ROUTES } from "@/constants/routes";
import { useReadOnlySectionError } from "@/hooks/use-read-only-section-error";

export function SecondaryMarketLoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  const text = label ?? t("secondaryMarket.errors.loadingDefault");

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-zinc-400" role="status">
      <SplitonLoader size="md" variant="light" label={text} />
      <p>{text}</p>
    </div>
  );
}

export function SecondaryMarketErrorState({
  message,
  onRetry,
  sectionId = "secondary-market",
}: {
  message: string | unknown;
  onRetry?: () => void;
  sectionId?: string;
}) {
  useReadOnlySectionError(sectionId, message, onRetry);

  return <SectionUnavailableState variant="dark" onRetry={onRetry} />;
}

export function SecondaryMarketEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#161616] ring-1 ring-white/8" aria-hidden>
        <span className="font-mono text-2xl text-zinc-600">∅</span>
      </div>
      <p className="text-[17px] font-semibold text-white">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-500">{description}</p> : null}
    </div>
  );
}

export function SecondaryMarketAuthGate() {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
      <p className="font-medium text-white">{t("secondaryMarket.auth.title")}</p>
      <p className="mt-2 text-zinc-500">{t("secondaryMarket.auth.description")}</p>
      <Link href={ROUTES.login} className="mt-4 inline-flex text-sm font-semibold text-[#B7F500] hover:underline">
        {t("secondaryMarket.auth.login")}
      </Link>
    </div>
  );
}
