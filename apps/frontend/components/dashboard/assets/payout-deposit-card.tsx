"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink } from "@/lib/lucide";
import { useCallback, useEffect, useState } from "react";

import { AuthActionPanel } from "@/components/shared/auth-action-panel";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { PayoutFlowFaqList } from "@/components/dashboard/assets/payout-flow-faq";
import { depositFaq } from "@/components/dashboard/assets/payout-flow-mock-data";
import { formatUsdtRu, formatWalletDate } from "@/lib/wallet/format-money";
import { depositStatusLabel } from "@/lib/wallet/status-labels";
import { formatUsdtAmount } from "@/lib/i18n/formatters";
import { tf } from "@/lib/i18n/financial-messages";
import { depositHistory } from "@/components/dashboard/assets/payout-flow-mock-data";
import { ROUTES } from "@/constants/routes";
import { isLivePayoutsEnabled } from "@/lib/public-env";
import {
  fetchDepositInfo,
  listUserDeposits,
  WalletApiError,
  type DepositInfoResponse,
  type UserDepositItem,
  walletErrorMessage,
} from "@/services/wallet.service";
import { CopyValueButton } from "@/components/wallet/copy-value-button";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/utils";

const MOCK_ADDRESS = "TP5eB1Af8zqufUFFDBuuT5shfbBveo3";
const MOCK_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

function shortAddress(addr: string, head = 8, tail = 6) {
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function formatMinDeposit(amount: string, locale: Parameters<typeof formatUsdtAmount>[1]) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return formatUsdtAmount(n, locale);
}

export function PayoutDepositCard() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const dataSourceLive = isLivePayoutsEnabled();
  const useMockData = !dataSourceLive;
  const needsAuth = dataSourceLive && !isAuthenticated;
  const live = dataSourceLive && isAuthenticated;

  const [depositInfo, setDepositInfo] = useState<DepositInfoResponse | null>(null);
  const [deposits, setDeposits] = useState<UserDepositItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    setErrorCode(undefined);
    try {
      const [info, list] = await Promise.all([
        fetchDepositInfo(authorizedFetch, { lang: locale }),
        listUserDeposits(authorizedFetch),
      ]);
      if (info.isDevPlaceholder && process.env.NODE_ENV === "production") {
        setError(t("deposit.unavailableProduction"));
        setDepositInfo(null);
      } else if (info.providerStatus === "misconfigured") {
        setError(t("deposit.misconfigured"));
        setDepositInfo(null);
      } else {
        setDepositInfo(info);
      }
      setDeposits(list.items);
    } catch (e) {
      setDepositInfo(null);
      setError(walletErrorMessage(e));
      setErrorCode(e instanceof WalletApiError ? e.code : undefined);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live, locale, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayAddress = live ? depositInfo?.address : useMockData ? MOCK_ADDRESS : undefined;
  const providerBlocked =
    live &&
    depositInfo &&
    (depositInfo.providerStatus === "disabled" || depositInfo.providerStatus === "misconfigured");
  const showUnavailable =
    live && (error || providerBlocked || (!loading && !displayAddress));

  const metaRows = live && depositInfo
    ? [
        { label: t("deposit.minDepositLabel"), value: formatMinDeposit(depositInfo.minDepositAmount, locale) },
        ...(depositInfo.maxDepositAmount
          ? [
              {
                label: t("deposit.maxDepositLabel"),
                value: formatMinDeposit(depositInfo.maxDepositAmount, locale),
              },
            ]
          : []),
        { label: t("deposit.creditTimeLabel"), value: depositInfo.estimatedCreditTimeLabel },
        {
          label: t("deposit.withdrawAvailableLabel"),
          value: depositInfo.withdrawAvailableAfterLabel,
        },
        {
          label: t("deposit.tokenContractLabel"),
          value: depositInfo.tokenContractAddress ?? "—",
          copy: depositInfo.tokenContractAddress ?? undefined,
          explorer: depositInfo.explorerTokenUrl,
        },
      ]
    : [
        { label: t("deposit.minDepositLabel"), value: formatMinDeposit("0.01", locale) },
        { label: t("deposit.creditTimeLabel"), value: t("deposit.mock.creditTime") },
        { label: t("deposit.withdrawAvailableLabel"), value: t("deposit.mock.withdrawAfter") },
        { label: t("deposit.tokenContractLabel"), value: MOCK_CONTRACT, copy: MOCK_CONTRACT },
      ];

  async function copyAddress() {
    if (!displayAddress) return;
    const result = await copyTextToClipboard(displayAddress);
    if (result === "ok") {
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(false);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  }

  return (
    <section className="space-y-12 sm:space-y-14">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {live && depositInfo
            ? tf(t("deposit.eyebrow"), {
                asset: depositInfo.asset,
                network: depositInfo.network,
              })
            : tf(t("deposit.eyebrow"), { asset: "USDT", network: "TRC20" })}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[1.75rem]">
          {t("deposit.heading")}
        </h1>
      </header>

      {needsAuth ? (
        <AuthActionPanel
          title={t("auth.login.title")}
          description={t("deposit.loginGate")}
          ctaHref={ROUTES.login}
          ctaLabel={t("wallet.loginCta")}
          testId="deposit-login-gate"
        />
      ) : null}

      {live && depositInfo?.maintenanceMessage ? (
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/90 px-4 py-3 text-sm text-blue-950">
          {depositInfo.maintenanceMessage}
        </div>
      ) : null}

      {!needsAuth ? (
      <>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] xl:gap-12">
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-3 rounded-3xl bg-neutral-100 px-5 py-6">
              <div className="h-24 w-24 rounded-2xl bg-neutral-200" />
              <div className="h-4 w-2/3 rounded bg-neutral-200" />
              <div className="h-10 w-full rounded bg-neutral-200" />
            </div>
          ) : null}
          {showUnavailable ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-6 text-sm text-neutral-700">
              <p>{error ?? t("deposit.unavailable")}</p>
              {errorCode === "DEPOSIT_DISABLED" ? (
                <p className="mt-2 text-xs text-neutral-500">{t("deposit.disabledHint")}</p>
              ) : null}
              {errorCode === "DEPOSIT_ADDRESS_UNAVAILABLE" ||
              errorCode === "DEPOSIT_PROVIDER_UNAVAILABLE" ? (
                <p className="mt-2 text-xs text-neutral-500">{t("deposit.addressUnavailableHint")}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-blue-700 underline"
                  onClick={() => void load()}
                >
                  {t("common.retry")}
                </button>
                <Link href={ROUTES.support} className="text-blue-700 underline">
                  {t("deposit.contactSupport")}
                </Link>
              </div>
            </div>
          ) : displayAddress ? (
            <div className="rounded-3xl bg-blue-50/50 px-5 py-6">
              {live && depositInfo?.userWarnings?.length ? (
                <div className="mb-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                    {t("deposit.networkWarningTitle")}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-amber-950">
                    {depositInfo.userWarnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {live && depositInfo?.depositInstructions ? (
                <div className="mb-4 rounded-2xl bg-white/70 px-4 py-3 text-sm text-neutral-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {t("deposit.instructionsTitle")}
                  </p>
                  <p className="mt-1">{depositInfo.depositInstructions}</p>
                </div>
              ) : null}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
                  {live && depositInfo
                    ? depositInfo.networkDisplayName ?? `${depositInfo.asset} · ${depositInfo.network}`
                    : "USDT · TRC20"}
                </span>
                {live && depositInfo?.explorerAddressUrl ? (
                  <a
                    href={depositInfo.explorerAddressUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 underline"
                  >
                    {t("deposit.openExplorer")}
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)] sm:items-start">
                <div className="flex aspect-square max-w-[120px] items-center justify-center overflow-hidden rounded-2xl bg-white/90 p-2">
                  {live && depositInfo?.qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={depositInfo.qrDataUrl}
                      alt={t("deposit.qrAlt")}
                      width={108}
                      height={108}
                      className="size-full object-contain"
                    />
                  ) : useMockData ? (
                    <span className="text-xs font-medium text-neutral-400">{t("deposit.qrDemo")}</span>
                  ) : (
                    <span className="text-xs font-medium text-neutral-400">{t("deposit.qrUnavailable")}</span>
                  )}
                </div>
                <div className="rounded-2xl bg-white/90 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      {t("deposit.trc20Address")}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyAddress()}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-900 px-2.5 py-1.5 text-[11px] font-semibold text-white"
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? t("deposit.copied") : copyFailed ? t("deposit.copyFailed") : t("deposit.copyAddress")}
                    </button>
                  </div>
                  <p className="mt-2 break-all font-mono text-sm font-semibold leading-snug text-neutral-900 sm:text-base">
                    {addressExpanded ? displayAddress : shortAddress(displayAddress)}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-[11px] text-neutral-500 underline"
                    onClick={() => setAddressExpanded((v) => !v)}
                  >
                    {addressExpanded ? t("deposit.collapse") : t("deposit.showFull")}
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-blue-200/50 pt-4">
                {metaRows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 text-sm">
                    <span className="text-neutral-500">{row.label}</span>
                    <span className="flex max-w-[60%] flex-col items-end gap-1 text-right font-mono font-medium">
                      <span className="break-all">{row.value}</span>
                      {"copy" in row && row.copy ? (
                        <CopyValueButton value={row.copy} label={t("deposit.contractCopyLabel")} />
                      ) : null}
                      {"explorer" in row && row.explorer ? (
                        <a
                          href={row.explorer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-700 underline"
                        >
                          {t("deposit.openExplorer")}
                        </a>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
              {live && depositInfo ? (
                <p className="mt-3 text-xs text-neutral-500">
                  {tf(t("deposit.confirmationsHint"), {
                    count: String(depositInfo.minConfirmations),
                    date: formatWalletDate(depositInfo.updatedAt, locale),
                  })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-3xl bg-neutral-50/90 px-6 py-7 sm:px-7 sm:py-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">FAQ</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">
            {t("deposit.faqTitle")}
          </h2>
          <PayoutFlowFaqList items={depositFaq} defaultOpenId={depositFaq[0]?.id ?? null} />
        </aside>
      </div>
      </>
      ) : null}

      {!needsAuth ? (
      <DepositHistoryTable live={live} loading={loading} deposits={deposits} onRetry={() => void load()} />
      ) : null}
    </section>
  );
}

function DepositHistoryTable({
  live,
  loading,
  deposits,
  onRetry,
}: {
  live: boolean;
  loading: boolean;
  deposits: UserDepositItem[];
  onRetry: () => void;
}) {
  const { t, locale } = useI18n();
  const rows = live
    ? deposits
    : depositHistory.map((r) => ({
        id: r.id,
        amount: r.amount.replace(/[^\d.,]/g, ""),
        status: "completed",
        confirmations: 20,
        requiredConfirmations: 20,
        txHash: r.txId,
        createdAt: r.time,
        receivedAt: r.time,
      }));

  return (
    <div className="space-y-6 pt-2">
      <h2 className="text-lg font-semibold text-neutral-900">{t("deposit.historyTitle")}</h2>
      {loading && live ? <p className="text-sm text-neutral-500">{t("common.loading")}</p> : null}
      {!loading && live && rows.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("deposit.historyEmpty")}</p>
      ) : null}
      <div className="overflow-x-auto rounded-3xl bg-neutral-50/90">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              <th className="px-4 py-3.5 pl-5">{t("deposit.table.time")}</th>
              <th className="px-4 py-3.5">{t("deposit.table.txId")}</th>
              <th className="px-4 py-3.5">{t("deposit.table.amount")}</th>
              <th className="px-4 py-3.5">{t("deposit.table.confirmations")}</th>
              <th className="px-4 py-3.5">{t("deposit.table.id")}</th>
              <th className="px-4 py-3.5 pr-5">{t("deposit.table.status")}</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((row, i) => (
              <tr key={row.id} className={cn(i !== rows.length - 1 && "border-b border-neutral-100")}>
                <td className="px-4 py-3.5 pl-5">{formatWalletDate(row.createdAt, locale)}</td>
                <td className="px-4 py-3.5 font-mono text-xs">
                  <span className="break-all">{row.txHash ?? "—"}</span>
                  {row.txHash ? (
                    <div className="mt-1">
                      <CopyValueButton value={row.txHash} label="TxID" />
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3.5 font-mono font-semibold tabular-nums">
                  {formatUsdtRu(row.amount, "USDT", locale)}
                </td>
                <td className="px-4 py-3.5 text-neutral-600">
                  {row.confirmations}/{row.requiredConfirmations}
                </td>
                <td className="px-4 py-3.5">
                  <CopyValueButton value={row.id} label="ID" />
                </td>
                <td className="px-4 py-3.5 pr-5">
                  <span className="inline-flex rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-900">
                    {depositStatusLabel(row.status, t)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {live ? (
        <button type="button" className="text-xs text-neutral-500 underline" onClick={onRetry}>
          {t("deposit.refresh")}
        </button>
      ) : null}
    </div>
  );
}
