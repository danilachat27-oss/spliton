"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FinancialLightFlowDialog } from "@/components/dashboard/financial/financial-light-flow-dialog";
import { AuthActionPanel } from "@/components/shared/auth-action-panel";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { LegalConsentModal } from "@/components/compliance/legal-consent-modal";
import { LegalConsentGateAlert } from "@/components/compliance/legal-consent-gate-alert";
import { EligibilityNotice } from "@/components/compliance/eligibility-notice";
import { useLegalConsentGate } from "@/hooks/use-legal-consent-gate";
import { PayoutFlowFaqList } from "@/components/dashboard/assets/payout-flow-faq";
import {
  FlowContinueButton,
  FlowPanel,
  FlowSummaryRow,
} from "@/components/dashboard/assets/payout-flow-wizard-primitives";
import {
  createUserWithdrawal,
  fetchWalletSummary,
  getWalletDataSource,
  isValidTrc20Address,
  listUserWithdrawals,
  MIN_WITHDRAWAL_USDT,
  walletErrorMessage,
  type UserWithdrawalItem,
} from "@/services/wallet.service";
import { fetchPayoutsOverview, type PortfolioPayoutsOverviewApi } from "@/services/portfolio.service";
import { CopyValueButton } from "@/components/wallet/copy-value-button";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/financial-messages";
import { formatWalletDate, formatUsdtRu } from "@/lib/wallet/format-money";
import { WITHDRAW_DISPLAY_DEFAULTS } from "@/lib/wallet/withdraw-display-config";
import { getWithdrawFaqItems } from "@/lib/wallet/withdraw-faq";
import { withdrawalStatusLabel } from "@/lib/wallet/status-labels";
import { cn } from "@/lib/utils";

const DEPOSIT_PATH = "/assets/payouts/deposit";

type FlowPhase = null | "processing" | "success" | "failed";

function parseAmountInput(raw: string): number {
  const numeric = raw.replace(/[^\d.]/g, "");
  const n = Number.parseFloat(numeric);
  return Number.isFinite(n) ? n : 0;
}

export function PayoutWithdrawCard() {
  const { t, locale } = useI18n();
  const { authorizedFetch, isAuthenticated } = useAuth();
  const walletLive = getWalletDataSource() === "live";
  const needsAuth = walletLive && !isAuthenticated;
  const live = walletLive && isAuthenticated;
  const consentGate = useLegalConsentGate("WITHDRAWAL", live);

  const [amount, setAmount] = useState("100");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flowPhase, setFlowPhase] = useState<FlowPhase>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<UserWithdrawalItem | null>(null);
  const [history, setHistory] = useState<UserWithdrawalItem[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [availableBalance, setAvailableBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [payoutsOverview, setPayoutsOverview] = useState<PortfolioPayoutsOverviewApi | null>(null);

  const faqItems = useMemo(() => getWithdrawFaqItems(t), [t]);

  const minWithdrawalUsdt = useMemo(() => {
    const fromApi = payoutsOverview?.minWithdrawalUsdt;
    const parsed = fromApi != null ? Number.parseFloat(fromApi) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : MIN_WITHDRAWAL_USDT;
  }, [payoutsOverview?.minWithdrawalUsdt]);

  const amountNum = parseAmountInput(amount);
  const insufficientFunds =
    live && availableBalance != null && amountNum > Number.parseFloat(availableBalance);

  const withdrawMeta = useMemo(() => {
    const network = payoutsOverview?.network ?? WITHDRAW_DISPLAY_DEFAULTS.network;
    const feeUsdt = payoutsOverview?.withdrawalFeeUsdt ?? WITHDRAW_DISPLAY_DEFAULTS.fallbackNetworkFeeUsdt;
    const minAmount = payoutsOverview?.minWithdrawalUsdt ?? String(MIN_WITHDRAWAL_USDT);
    return [
      { label: t("withdraw.meta.network"), value: network },
      {
        label: t("withdraw.meta.networkFee"),
        value: formatUsdtRu(feeUsdt, "USDT", locale),
      },
      {
        label: t("withdraw.meta.minAmount"),
        value: formatUsdtRu(minAmount, "USDT", locale),
      },
      {
        label: t("withdraw.meta.processingTime"),
        value: t(WITHDRAW_DISPLAY_DEFAULTS.processingTimeHintKey),
      },
    ];
  }, [locale, payoutsOverview, t]);

  const loadHistory = useCallback(async () => {
    if (!live) return;
    try {
      const items = await listUserWithdrawals(authorizedFetch);
      setHistory(items);
    } catch {
      /* history optional on failure */
    }
  }, [authorizedFetch, live]);

  const loadBalance = useCallback(async () => {
    if (!live) return;
    setBalanceLoading(true);
    try {
      const summary = await fetchWalletSummary(authorizedFetch);
      setAvailableBalance(summary.availableBalance);
    } catch {
      setAvailableBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [authorizedFetch, live]);

  const loadPayoutsMeta = useCallback(async () => {
    if (!live) return;
    try {
      const overview = await fetchPayoutsOverview(authorizedFetch);
      setPayoutsOverview(overview);
    } catch {
      setPayoutsOverview(null);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void loadHistory();
    void loadBalance();
    void loadPayoutsMeta();
  }, [loadHistory, loadBalance, loadPayoutsMeta]);

  const resetFlow = useCallback(() => {
    setFlowOpen(false);
    setFlowPhase(null);
    setFailedMessage(null);
    setSubmitSuccess(null);
  }, []);

  async function handleSubmit() {
    if (submitting || insufficientFunds) return;

    if (!isValidTrc20Address(address)) {
      setFailedMessage(t("withdraw.validationAddressFormat"));
      setFlowPhase("failed");
      setFlowOpen(true);
      return;
    }
    if (amountNum < minWithdrawalUsdt) {
      setFailedMessage(tf(t("withdraw.validationMinAmount"), { min: String(minWithdrawalUsdt) }));
      setFlowPhase("failed");
      setFlowOpen(true);
      return;
    }

    if (!live) {
      setFailedMessage(t("withdraw.demoMode"));
      setFlowPhase("failed");
      setFlowOpen(true);
      return;
    }

    consentGate.requestProceed(async () => {
      setSubmitting(true);
      setFlowPhase("processing");
      setFlowOpen(true);
      setFailedMessage(null);
      setSubmitSuccess(null);
      try {
        const created = await createUserWithdrawal(
          { amount: String(amountNum), toAddress: address.trim() },
          authorizedFetch,
        );
        setSubmitSuccess(created);
        setFlowPhase("success");
        void loadHistory();
        void loadBalance();
      } catch (e) {
        setFailedMessage(walletErrorMessage(e));
        setFlowPhase("failed");
      } finally {
        setSubmitting(false);
      }
    });
  }

  const displayHistory = live && history.length > 0 ? history : null;
  const formattedBalance =
    availableBalance != null ? formatUsdtRu(availableBalance, "USDT", locale).replace(/ USDT$/, "") : null;

  return (
    <section className="space-y-12 sm:space-y-14">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">{t("withdraw.eyebrow")}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[1.75rem]">{t("withdraw.heading")}</h1>
      </header>

      {needsAuth ? (
        <AuthActionPanel
          title={t("auth.login.title")}
          description={t("withdraw.loginGate")}
          ctaHref={ROUTES.login}
          ctaLabel={t("wallet.loginCta")}
          testId="withdraw-login-gate"
        />
      ) : null}

      {!needsAuth ? (
      <>
      {live ? <EligibilityNotice result={consentGate.eligibility} className="max-w-2xl" /> : null}
      {live ? <LegalConsentGateAlert gate={consentGate} className="max-w-2xl" /> : null}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] xl:gap-12">
        <div className="flex flex-col gap-4">
          {step >= 2 ? (
            <FlowSummaryRow
              stepId={1}
              title={t("withdraw.stepCryptoTitle")}
              value="USDT"
              onEdit={() => setStep(1)}
            />
          ) : null}
          {step >= 3 ? (
            <FlowSummaryRow
              stepId={2}
              title={t("withdraw.stepAddressTitle")}
              value={address}
              onEdit={() => setStep(2)}
            />
          ) : null}

          {step === 1 ? (
            <FlowPanel stepId={1} title={t("withdraw.stepCryptoTitle")}>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex h-12 w-full rounded-2xl bg-white/90 px-4 text-sm font-medium text-neutral-800"
                placeholder={t("withdraw.amountPlaceholder")}
              />
              {live ? (
                <p className="text-xs text-neutral-500">
                  {balanceLoading
                    ? t("withdraw.loadingBalance")
                    : formattedBalance
                      ? `${t("withdraw.availableLabel")}: ${formatUsdtRu(availableBalance!, "USDT", locale)}`
                      : null}
                </p>
              ) : null}
              <FlowContinueButton label={t("common.continue")} onClick={() => setStep(2)} />
            </FlowPanel>
          ) : null}

          {step === 2 ? (
            <FlowPanel stepId={2} title={t("withdraw.stepAddressTitle")}>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-2xl bg-white/90 px-4 py-4 font-mono text-sm text-neutral-900"
                placeholder={t("withdraw.addressPlaceholder")}
              />
              {address && !isValidTrc20Address(address) ? (
                <p className="text-xs text-red-600">{t("withdraw.validationAddressFormat")}</p>
              ) : null}
              <FlowContinueButton label={t("common.continue")} onClick={() => setStep(3)} />
            </FlowPanel>
          ) : null}

          {step === 3 ? (
            <FlowPanel stepId={3} title={t("withdraw.stepAmountTitle")} tone="accent">
              <div className="flex min-h-12 flex-col justify-center gap-1 rounded-2xl bg-white/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-neutral-500">{t("withdraw.amountLabel")}</span>
                <span className="font-mono text-base font-semibold tabular-nums text-neutral-900">
                  {formatUsdtRu(String(amountNum), "USDT", locale)}
                </span>
              </div>

              {insufficientFunds ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
                  <p className="font-semibold">{t("withdraw.insufficientFunds")}</p>
                  <p className="mt-1 text-xs">
                    {tf(t("withdraw.insufficientAvailable"), { balance: formattedBalance ?? "—" })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold"
                    >
                      {t("withdraw.editAmount")}
                    </button>
                    <Link
                      href={DEPOSIT_PATH}
                      className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {t("withdraw.topUpWallet")}
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2.5 border-t border-blue-200/50 pt-5">
                {withdrawMeta.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-neutral-500">{row.label}</span>
                    <span className="font-mono font-medium text-neutral-900">{row.value}</span>
                  </div>
                ))}
              </div>
              {live ? (
                <p className="text-[11px] leading-snug text-neutral-500">{t("withdraw.meta.feeEstimateNote")}</p>
              ) : null}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={
                    submitting ||
                    insufficientFunds ||
                    flowPhase === "processing" ||
                    consentGate.isChecking ||
                    consentGate.checkError ||
                    consentGate.hasBlockingEligibility
                  }
                  onClick={() => void handleSubmit()}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
                >
                  {submitting ? t("withdraw.submitting") : t("withdraw.submitRequest")}
                </button>
              </div>
              {!live ? <p className="text-xs text-neutral-500">{t("withdraw.mockHint")}</p> : null}
            </FlowPanel>
          ) : null}
        </div>

        <aside className="h-fit rounded-3xl bg-neutral-50/90 px-6 py-7 sm:px-7 sm:py-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">FAQ</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">{t("withdraw.faqTitle")}</h2>
          <PayoutFlowFaqList items={faqItems} defaultOpenId={faqItems[0]?.id ?? null} />
        </aside>
      </div>

      {displayHistory ? (
        <div className="overflow-x-auto rounded-3xl bg-neutral-50/90">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                <th className="px-4 py-3.5 pl-5">{t("withdraw.table.date")}</th>
                <th className="px-4 py-3.5">{t("withdraw.table.address")}</th>
                <th className="px-4 py-3.5">{t("withdraw.table.amount")}</th>
                <th className="px-4 py-3.5">{t("withdraw.table.fee")}</th>
                <th className="px-4 py-3.5">{t("withdraw.table.id")}</th>
                <th className="px-4 py-3.5 pr-5">{t("withdraw.table.status")}</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {displayHistory.map((row, i) => (
                <tr key={row.id} className={cn(i !== displayHistory.length - 1 && "border-b border-neutral-100")}>
                  <td className="px-4 py-3.5 pl-5 text-neutral-700">{formatWalletDate(row.requestedAt)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-neutral-600">
                    <span className="break-all">{row.toAddress}</span>
                    <div className="mt-1">
                      <CopyValueButton value={row.toAddress} label={t("withdraw.copyAddressLabel")} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-semibold tabular-nums">{formatUsdtRu(row.amountUsdt)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs">{formatUsdtRu(row.feeUsdt)}</td>
                  <td className="px-4 py-3.5">
                    <CopyValueButton value={row.id} label={t("withdraw.table.id")} />
                    {row.blockchainTxid ? (
                      <div className="mt-1">
                        <CopyValueButton value={row.blockchainTxid} label="TxID" />
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5 pr-5">
                    <span className="inline-flex rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-950">
                      {withdrawalStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <FinancialLightFlowDialog
        open={flowOpen && flowPhase != null}
        onOpenChange={(open) => {
          if (!open && flowPhase !== "processing") resetFlow();
        }}
        step={flowPhase === "processing" ? "processing" : flowPhase === "success" ? "success" : "failed"}
        blockDismiss={flowPhase === "processing"}
        title={
          flowPhase === "processing"
            ? t("withdraw.processingTitle")
            : flowPhase === "success"
              ? t("withdraw.resultSuccessTitle")
              : t("withdraw.failedTitle")
        }
        description={
          flowPhase === "processing"
            ? t("withdraw.processingBody")
            : flowPhase === "failed"
              ? failedMessage ?? t("withdraw.failedBody")
              : undefined
        }
        primaryAction={
          flowPhase === "success"
            ? { label: t("withdraw.openHistory"), href: ROUTES.dashboardPayoutsHistory, onClick: resetFlow }
            : flowPhase === "failed"
              ? {
                  label: t("withdraw.retry"),
                  onClick: () => {
                    resetFlow();
                  },
                }
              : undefined
        }
        secondaryAction={
          flowPhase === "failed"
            ? {
                label: t("withdraw.editAmount"),
                onClick: () => {
                  resetFlow();
                  setStep(1);
                },
              }
            : undefined
        }
      >
        {flowPhase === "success" && submitSuccess ? (
          <dl className="space-y-2 font-mono text-[13px] tabular-nums text-neutral-800">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">{t("withdraw.resultAmount")}</dt>
              <dd>{formatUsdtRu(submitSuccess.amountUsdt, "USDT", locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">{t("withdraw.resultNetwork")}</dt>
              <dd>TRC20</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">{t("withdraw.resultAddress")}</dt>
              <dd className="max-w-[200px] truncate text-right">{submitSuccess.toAddress}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">{t("withdraw.resultRequestId")}</dt>
              <dd className="truncate text-right">{submitSuccess.id.slice(0, 12)}…</dd>
            </div>
          </dl>
        ) : null}
      </FinancialLightFlowDialog>

      <LegalConsentModal
        open={consentGate.consentOpen}
        title={t("withdraw.consentTitle")}
        description={t("withdraw.consentDescription")}
        items={consentGate.missingItems}
        source="WITHDRAWAL"
        authorizedFetch={authorizedFetch}
        onAccepted={consentGate.onConsentAccepted}
        onClose={() => consentGate.dismissConsent()}
      />
      </>
      ) : null}
    </section>
  );
}
