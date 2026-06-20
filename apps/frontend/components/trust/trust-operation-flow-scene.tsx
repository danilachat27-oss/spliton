"use client";

import "./trust-operation-flow-scene.css";

import { Check } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "deposit",
    label: "Пополнение",
    shortLabel: "Ввод",
    step: "01",
    title: "Пополнение USDT (TRC20)",
    description: "Средства зачисляются после подтверждения сети и проверки оператором.",
  },
  {
    id: "ledger",
    label: "Ledger",
    shortLabel: "Ledger",
    step: "02",
    title: "Запись в ledger",
    description: "Баланс обновляется с типом операции, суммой и ссылкой на транзакцию.",
  },
  {
    id: "trade",
    label: "Сделка",
    shortLabel: "Сделка",
    step: "03",
    title: "Покупка или торговля",
    description: "Первичный или вторичный рынок списывает и начисляет USDT по правилам релиза.",
  },
  {
    id: "accrual",
    label: "Начисления",
    shortLabel: "Доход",
    step: "04",
    title: "Распределение дохода",
    description: "Доход по релизу распределяется держателям пропорционально юнитам.",
  },
  {
    id: "withdraw",
    label: "Вывод",
    shortLabel: "Вывод",
    step: "05",
    title: "Вывод средств",
    description: "Заявка проходит treasury и compliance; статус виден в истории выплат.",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function DoneIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100", className)}
      aria-hidden
    >
      <Check className="size-2.5 stroke-[3] text-emerald-700" />
    </span>
  );
}

function DrawnCheckmark({
  step,
  size = "sm",
  variant = "overlay",
  className,
}: {
  step: StepId;
  size?: "sm" | "md" | "lg" | "hero";
  variant?: "overlay" | "toast" | "inline";
  className?: string;
}) {
  const px = size === "hero" ? 72 : size === "lg" ? 44 : size === "md" ? 32 : 22;
  const wrapCls =
    variant === "inline"
      ? `trust-op-check-inline--${step}`
      : variant === "toast"
        ? `trust-op-check-toast--${step}`
        : `trust-op-check-wrap--${step}`;

  return (
    <div className={cn("relative grid place-items-center", wrapCls, className)} aria-hidden>
      {variant === "overlay" ? (
        <>
          <span className={cn("trust-op-check-burst absolute rounded-full bg-emerald-400/25", `trust-op-check-burst--${step}`)} />
          <span className={cn("trust-op-check-burst trust-op-check-burst--delay absolute rounded-full bg-[#B7F500]/20", `trust-op-check-burst--${step}`)} />
        </>
      ) : null}
      <svg width={px} height={px} viewBox="0 0 52 52" className="relative z-[1]">
        <circle
          className={cn("trust-op-check-circle", `trust-op-check-circle--${step}`)}
          cx="26"
          cy="26"
          r="23"
          fill="rgb(236 253 245)"
          stroke="rgb(16 185 129)"
          strokeWidth="2.5"
        />
        <path
          className={cn("trust-op-check-path", `trust-op-check-path--${step}`)}
          d="M15 27.5 L23.5 36 L37.5 18.5"
          fill="none"
          stroke="rgb(5 150 105)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FlowCursor({ step, hint, className }: { step: StepId; hint: string; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute z-30", className)} aria-hidden>
      <div className={cn("trust-op-cursor relative", `trust-op-cursor--${step}`)}>
        <svg width="18" height="20" viewBox="0 0 14 16" className="drop-shadow-md">
          <path
            d="M1 1L1 13.5L4.2 10.3L6.5 15.5L8.2 14.7L5.9 9.5L10.5 9.5L1 1Z"
            fill="white"
            stroke="#111"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className={cn("trust-op-ring absolute left-2 top-2 size-3.5 rounded-full border-2 border-[#B7F500]/90", `trust-op-ring--${step}`)} />
        <span
          className={cn(
            "trust-op-tip absolute left-5 top-4 whitespace-nowrap rounded-lg bg-neutral-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg",
            `trust-op-tip--${step}`,
          )}
        >
          {hint}
        </span>
      </div>
    </div>
  );
}

function SceneToast({
  step,
  title,
  subtitle,
  tone = "neutral",
  className,
}: {
  step: StepId;
  title: string;
  subtitle: string;
  tone?: "neutral" | "success" | "warning";
  className?: string;
}) {
  const toneCls =
    tone === "success"
      ? "border-emerald-200/80 bg-emerald-50"
      : tone === "warning"
        ? "border-amber-200/80 bg-amber-50"
        : "border-neutral-200/80 bg-white";

  return (
    <div
      className={cn(
        "trust-op-toast pointer-events-none absolute z-20 flex items-start gap-2 rounded-xl border px-3 py-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]",
        `trust-op-toast--${step}`,
        toneCls,
        className,
      )}
      aria-hidden
    >
      {tone === "success" ? (
        <DrawnCheckmark step={step} size="sm" variant="toast" className="mt-0.5 shrink-0" />
      ) : (
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-[#B7F500]" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-neutral-900">{title}</p>
        <p className="text-[9px] leading-snug text-neutral-600">{subtitle}</p>
      </div>
    </div>
  );
}

function SceneSpinner({ step, label, className }: { step: StepId; label: string; className?: string }) {
  return (
    <div
      className={cn(
        "trust-op-spinner pointer-events-none absolute z-10 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-sm",
        `trust-op-spinner--${step}`,
        className,
      )}
      aria-hidden
    >
      <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
      <span className="text-[10px] font-medium text-neutral-700">{label}</span>
    </div>
  );
}

function MiniChrome() {
  return (
    <div className="flex h-8 shrink-0 items-center gap-2 border-b border-neutral-200/80 bg-white px-3">
      <span className="size-2 rounded-full bg-red-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-amber-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-emerald-400/90" aria-hidden />
      <span className="ml-1 truncate text-[10px] font-medium text-neutral-400">Spliton · Кабинет</span>
      <span className="trust-op-badge-dot ml-auto size-1.5 rounded-full bg-[#B7F500]" aria-hidden />
    </div>
  );
}

function DepositPanel() {
  const { t } = useI18n();

  return (
    <div className="trust-op-panel--deposit pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="deposit"
        title={t("trust.scene.operationFlow.toast.deposit.title")}
        subtitle={t("trust.scene.operationFlow.toast.deposit.subtitle")}
        tone="success"
        className="right-3 top-3 w-[11.5rem] sm:right-4 sm:top-4"
      />
      <SceneSpinner step="deposit" label="Проверка сети TRC20…" className="left-4 top-14 sm:left-6" />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Выплаты · Кошелёк</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">Пополнение USDT</p>

      <div className="trust-op-wallet-card relative mt-3 rounded-2xl bg-neutral-50 px-4 py-3">
        <p className="text-[10px] text-neutral-500">Доступный баланс</p>
        <div className="mt-1 flex items-end gap-2">
          <div className="relative h-7 min-w-[6.5rem]">
            <p className="trust-op-balance-from absolute inset-0 font-mono text-lg font-semibold tabular-nums text-neutral-900">1 000,00</p>
            <p className="trust-op-balance-to absolute inset-0 font-mono text-lg font-semibold tabular-nums text-emerald-600">1 500,00</p>
          </div>
          <span className="text-[10px] font-medium text-neutral-500">USDT</span>
        </div>
        <p className="trust-op-wallet-status mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-semibold text-emerald-800">
          <DoneIcon />
          <span>{t("trust.scene.operationFlow.creditedToBalance")}</span>
        </p>
      </div>

      <div className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3">
        <p className="text-[10px] text-neutral-500">Адрес для перевода</p>
        <p className="mt-1 truncate font-mono text-xs text-neutral-800">TXk9…4F2a</p>
      </div>

      <div className="relative mt-auto pt-3">
        <button type="button" className="trust-op-deposit-btn relative w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-semibold text-white">
          Подтвердить пополнение
          <FlowCursor step="deposit" hint="Пополнение" className="right-4 top-1/2 -translate-y-1/2" />
        </button>
      </div>
    </div>
  );
}

function LedgerPanel() {
  const { t } = useI18n();

  return (
    <div className="trust-op-panel--ledger pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="ledger"
        title={t("trust.scene.operationFlow.toast.ledger.title")}
        subtitle={t("trust.scene.operationFlow.toast.ledger.subtitle")}
        tone="success"
        className="right-3 top-3 w-[12rem] sm:right-4 sm:top-4"
      />
      <SceneSpinner step="ledger" label="Фиксация операции…" className="left-4 top-14 sm:left-6" />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Ledger</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">История операций</p>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2.5">
        <p className="text-[10px] text-neutral-500">Баланс после записи</p>
        <p className="font-mono text-lg font-semibold tabular-nums text-neutral-900">1 500,00 USDT</p>
      </div>

      <div className="trust-op-ledger-row relative mt-2 rounded-xl px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-neutral-800">deposit · TRC20</span>
          <span className="trust-op-ledger-amount font-mono text-xs font-semibold text-emerald-700">+500,00</span>
        </div>
        <p className="mt-0.5 font-mono text-[10px] text-neutral-500">tx · 0x8f…c21 · запись подтверждена</p>
        <FlowCursor step="ledger" hint="Запись в ledger" className="right-3 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}

function TradePanel() {
  const { t } = useI18n();

  return (
    <div className="trust-op-panel--trade pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="trade"
        title={t("trust.scene.operationFlow.toast.trade.title")}
        subtitle={t("trust.scene.operationFlow.toast.trade.subtitle")}
        tone="success"
        className="right-3 top-3 w-[12rem] sm:right-4 sm:top-4"
      />
      <SceneSpinner step="trade" label="Исполнение сделки…" className="left-4 top-14 sm:left-6" />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Первичный рынок</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">Relic Waves · 50 UNT</p>

      <div className="relative mt-3 rounded-2xl bg-neutral-50 px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-600">Сумма сделки</span>
          <span className="font-mono font-semibold text-neutral-900">700,00 USDT</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-neutral-600">Platform fee</span>
          <span className="font-mono text-neutral-700">−18,20 USDT</span>
        </div>
        <p className="trust-op-trade-done mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
          <DoneIcon />
          Итого списано: 681,80 USDT
        </p>
      </div>

      <div className="relative mt-auto pt-3">
        <button type="button" className="trust-op-trade-btn relative w-full rounded-xl bg-[#B7F500] py-2.5 text-xs font-semibold text-black">
          Купить долю
          <FlowCursor step="trade" hint="Сделка" className="right-4 top-1/2 -translate-y-1/2" />
        </button>
      </div>
    </div>
  );
}

function AccrualPanel() {
  const { t } = useI18n();

  return (
    <div className="trust-op-panel--accrual pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="accrual"
        title={t("trust.scene.operationFlow.toast.accrual.title")}
        subtitle={t("trust.scene.operationFlow.toast.accrual.subtitle")}
        tone="success"
        className="right-3 top-3 w-[12rem] sm:right-4 sm:top-4"
      />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Начисления</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">Доход по релизу</p>

      <div className="trust-op-accrual-card relative mt-4 flex flex-col items-center justify-center rounded-2xl bg-neutral-50 px-4 py-7 text-center sm:py-8">
        <p className="trust-op-accrual-val font-mono text-3xl font-semibold tabular-nums text-emerald-600 sm:text-4xl">+12,40 USDT</p>
        <p className="mt-2 text-xs text-neutral-500">50 UNT · квартал Q2</p>
        <p className="trust-op-accrual-badge relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
          <DoneIcon />
          {t("trust.scene.operationFlow.creditedToBalance")}
          <FlowCursor step="accrual" hint="Начисление" className="left-[calc(100%+0.35rem)] top-1/2 -translate-y-1/2" />
        </p>
      </div>
    </div>
  );
}

function WithdrawPanel() {
  const { t } = useI18n();

  return (
    <div className="trust-op-panel--withdraw pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="withdraw"
        title={t("trust.scene.operationFlow.toast.withdraw.title")}
        subtitle={t("trust.scene.operationFlow.toast.withdraw.subtitle")}
        tone="success"
        className="trust-op-withdraw-toast right-3 top-3 w-[11.5rem] sm:right-4 sm:top-4"
      />
      <SceneSpinner step="withdraw" label="Проверка treasury · compliance…" className="left-4 top-14 sm:left-6" />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Вывод</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">Заявка на вывод</p>

      <div className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3">
        <p className="text-[10px] text-neutral-500">Сумма</p>
        <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-neutral-900">200,00 USDT</p>
        <p className="mt-2 text-[10px] text-neutral-500">Сеть TRC20 · адрес TXp1…9a8c</p>
      </div>

      <div className="relative mt-3 rounded-2xl bg-neutral-50 p-3">
        <div className="space-y-2">
        <div className="trust-op-withdraw-pending rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-950">
          На проверке compliance
        </div>
        <div className="trust-op-withdraw-approved relative flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-xs font-semibold text-emerald-800">
          <DoneIcon />
          Одобрено · в очереди отправки
          <FlowCursor step="withdraw" hint="Вывод" className="right-3 top-1/2 -translate-y-1/2" />
        </div>
        </div>
      </div>
    </div>
  );
}

export function TrustOperationFlowScene() {
  return (
    <section className="trust-op-flow-scene rounded-2xl bg-white px-4 py-6 sm:rounded-3xl sm:px-8 sm:py-10" aria-labelledby="trust-flow-heading">
      <div className="text-center">
        <h2 id="trust-flow-heading" className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl lg:text-3xl">
          Как проходят операции
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-neutral-600 sm:text-sm">
          От пополнения до вывода — каждый этап в ledger и в кабинете. Описание процесса, не гарантия доходности.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl bg-[#f6f7f9] sm:mt-10 sm:rounded-3xl">
        <MiniChrome />
        <div className="trust-op-scene-viewport relative min-h-[320px] overflow-hidden bg-white sm:min-h-[360px] lg:min-h-[380px]">
          <DepositPanel />
          <LedgerPanel />
          <TradePanel />
          <AccrualPanel />
          <WithdrawPanel />
        </div>
      </div>

      <div className="relative mx-auto mt-10 max-w-4xl overflow-visible pb-1 sm:mt-12">
        <div
          className="pointer-events-none absolute left-8 right-8 top-[3.15rem] hidden h-px bg-neutral-200 sm:top-[3.85rem] sm:block"
          aria-hidden
        >
          <div className="trust-op-progress h-full bg-[#B7F500]" />
        </div>

        <div className="-mx-1 overflow-x-auto overflow-y-visible pb-4 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:pb-2 [&::-webkit-scrollbar]:hidden">
          <div className="grid min-w-[20rem] grid-cols-5 gap-0.5 px-1 sm:min-w-0 sm:gap-2">
            {STEPS.map((step) => (
              <div key={step.id} className="trust-op-timeline-step flex flex-col items-center text-center">
                <span className={cn("trust-op-step-label--" + step.id, "relative min-h-8 max-w-[4.5rem] text-[10px] leading-snug sm:min-h-10 sm:max-w-[9rem] sm:text-sm")}>
                  <span className="relative inline-block pb-1">
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                    <span
                      className={cn("trust-op-underline--" + step.id, "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-[#B7F500]")}
                      aria-hidden
                    />
                  </span>
                </span>
                <div className="mt-2 flex size-10 items-center justify-center sm:mt-3 sm:size-12">
                  <div
                    className={cn(
                      "trust-op-step-dot trust-op-step-dot--" + step.id,
                      "flex size-8 items-center justify-center rounded-full font-mono text-[9px] font-bold sm:size-10 sm:text-[10px]",
                    )}
                  >
                    {step.step}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-8 min-h-[9.5rem] max-w-2xl text-center sm:mt-12 sm:min-h-[7.5rem]">
        {STEPS.map((step) => (
          <div key={step.id} className={cn("trust-op-detail--" + step.id, "absolute inset-x-0 top-0 px-1 sm:px-0")} aria-hidden={step.id !== "deposit"}>
            <p className="text-xs text-neutral-500 sm:text-sm">{step.step}</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl lg:text-2xl">{step.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 sm:mt-3 sm:text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
