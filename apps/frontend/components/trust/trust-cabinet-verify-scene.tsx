"use client";

import "./trust-cabinet-verify-scene.css";

import Link from "next/link";
import { ArrowRight, ChevronRight, FileText, ShieldCheck } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "history",
    label: "История",
    title: "История пополнений, сделок и выводов",
    description: "Каждая операция в ledger — тип, сумма, дата и ссылка на транзакцию.",
    href: ROUTES.dashboardPayoutsHistory,
    hrefLabel: "История операций",
  },
  {
    id: "statements",
    label: "Выписки",
    title: "Выписки по счёту и квитанции",
    description: "Периодические выписки и квитанции по сделкам — для учёта и самопроверки.",
    href: ROUTES.dashboardStatements,
    hrefLabel: "Выписки",
  },
  {
    id: "withdrawals",
    label: "Выводы",
    title: "Статус заявок на вывод",
    description: "Treasury и compliance: этап проверки, одобрение и очередь отправки.",
    href: ROUTES.dashboardPayoutsHistory,
    hrefLabel: "Заявки на вывод",
  },
  {
    id: "documents",
    label: "Документы",
    title: "Документы релиза в data room",
    description: "Term sheet, политики выплат и материалы релиза до входа в сделку.",
    href: ROUTES.dashboardDocuments,
    hrefLabel: "Документы",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function MiniCheck({ step }: { step: StepId }) {
  return (
    <svg width="22" height="22" viewBox="0 0 44 44" className="shrink-0" aria-hidden>
      <circle className={cn("trust-cab-check-circle", `trust-cab-check-circle--${step}`)} cx="22" cy="22" r="19" fill="rgb(236 253 245)" stroke="rgb(16 185 129)" strokeWidth="2" />
      <path
        className={cn("trust-cab-check-path", `trust-cab-check-path--${step}`)}
        d="M13 22.5 L19 28.5 L31 16"
        fill="none"
        stroke="rgb(5 150 105)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SceneSpinner({ step, label }: { step: StepId; label: string }) {
  return (
    <div className={cn("trust-cab-spinner pointer-events-none absolute left-3 top-12 z-20 flex items-center gap-2 rounded-xl border border-neutral-200/60 bg-white/95 px-2.5 py-1.5 shadow-sm", `trust-cab-spinner--${step}`)} aria-hidden>
      <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
      <span className="text-[9px] font-medium text-neutral-700">{label}</span>
    </div>
  );
}

function HistoryPanel() {
  const { t } = useI18n();
  const rows = [
    { type: "deposit", label: "Пополнение · TRC20", amount: "+500,00", tone: "green" as const },
    { type: "trade", label: "Сделка · Relic Waves", amount: "−681,80", tone: "neutral" as const },
    { type: "accrual", label: "Начисление · Q2", amount: "+12,40", tone: "green" as const },
  ];

  return (
    <div className="trust-cab-panel trust-cab-panel--history pointer-events-none absolute inset-0 flex flex-col p-3">
      <SceneSpinner step="history" label={t("trust.scene.cabinetVerify.spinner.history")} />
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Кошелёк · История</p>
      <p className="mt-0.5 text-xs font-semibold text-neutral-900">Последние операции</p>

      <div className="mt-2 space-y-1">
        {rows.map((row, i) => (
          <div
            key={row.type}
            className={cn(
              "trust-cab-history-row flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-2",
              `trust-cab-history-row--${i + 1}`,
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium text-neutral-800">{row.label}</p>
              <p className="font-mono text-[8px] text-neutral-500">14 июн. 2026 · #00{i + 1}</p>
            </div>
            <span className={cn("font-mono text-[10px] font-semibold tabular-nums", row.tone === "green" ? "text-emerald-700" : "text-neutral-800")}>
              {row.amount}
            </span>
          </div>
        ))}
      </div>

      <div className="trust-cab-history-total mt-auto flex items-center justify-between rounded-lg bg-neutral-900 px-2.5 py-2 text-white">
        <span className="text-[9px] text-neutral-400">Доступно</span>
        <span className="font-mono text-[11px] font-semibold tabular-nums">1 830,60 USDT</span>
      </div>
    </div>
  );
}

function StatementsPanel() {
  const { t } = useI18n();

  return (
    <div className="trust-cab-panel trust-cab-panel--statements pointer-events-none absolute inset-0 flex flex-col p-3">
      <SceneSpinner step="statements" label={t("trust.scene.cabinetVerify.spinner.statements")} />
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Выписки</p>
      <p className="mt-0.5 text-xs font-semibold text-neutral-900">Счёт USDT · TRC20</p>

      <div className="trust-cab-statement-card relative mt-2 overflow-hidden rounded-xl bg-neutral-50 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold text-neutral-900">Выписка Q2 2026</p>
            <p className="mt-0.5 text-[8px] text-neutral-500">01 апр. — 30 июн. · 18 операций</p>
          </div>
          <MiniCheck step="statements" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div className="rounded-md bg-white px-2 py-1.5">
            <p className="text-[8px] text-neutral-500">Пополнения</p>
            <p className="font-mono text-[10px] font-semibold text-emerald-700">+1 000,00</p>
          </div>
          <div className="rounded-md bg-white px-2 py-1.5">
            <p className="text-[8px] text-neutral-500">Списания</p>
            <p className="font-mono text-[10px] font-semibold text-neutral-800">−681,80</p>
          </div>
        </div>
        <div className="trust-cab-statement-btn mt-2 rounded-lg bg-neutral-900 py-1.5 text-center text-[9px] font-semibold text-white">
          Скачать PDF
        </div>
      </div>

      <p className="trust-cab-receipt mt-2 flex items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-white px-2.5 py-2 text-[9px] text-neutral-700">
        <FileText className="size-3 shrink-0 text-neutral-400" aria-hidden />
        Квитанция · сделка #RW-0412
      </p>
    </div>
  );
}

function WithdrawalsPanel() {
  const { t } = useI18n();

  return (
    <div className="trust-cab-panel trust-cab-panel--withdrawals pointer-events-none absolute inset-0 flex flex-col p-3">
      <SceneSpinner step="withdrawals" label={t("trust.scene.cabinetVerify.spinner.withdrawals")} />
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Выводы</p>
      <p className="mt-0.5 text-xs font-semibold text-neutral-900">Заявка #WD-2026-118</p>

      <div className="trust-cab-withdraw-card mt-2 rounded-xl bg-neutral-50 p-2.5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-sm font-semibold text-neutral-900">200,00 USDT</p>
          <span className="trust-cab-withdraw-status rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-semibold text-amber-900">
            На проверке
          </span>
        </div>
        <p className="mt-1 font-mono text-[8px] text-neutral-500">TRC20 · TXp1…9a8c</p>

        <div className="trust-cab-withdraw-steps mt-2.5 flex items-center gap-1">
          {["Создана", "Compliance", "Отправка"].map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-0.5">
              <span className={cn("trust-cab-withdraw-step flex size-4 items-center justify-center rounded-full text-[7px] font-bold", `trust-cab-withdraw-step--${i + 1}`)}>
                {i + 1}
              </span>
              <span className="text-[7px] text-neutral-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="trust-cab-withdraw-done mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-2">
        <MiniCheck step="withdrawals" />
        <p className="text-[9px] font-semibold text-emerald-800">Предыдущий вывод · одобрен 02 июн.</p>
      </div>
    </div>
  );
}

function DocumentsPanel() {
  const { t } = useI18n();
  const docs = [
    { name: "Term Sheet · Relic Waves", tag: "PDF" },
    { name: "Политика выплат Q2", tag: "PDF" },
    { name: "Data room · материалы", tag: "3 файла" },
  ];

  return (
    <div className="trust-cab-panel trust-cab-panel--documents pointer-events-none absolute inset-0 flex flex-col p-3">
      <SceneSpinner step="documents" label={t("trust.scene.cabinetVerify.spinner.documents")} />
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Data room</p>
      <p className="mt-0.5 text-xs font-semibold text-neutral-900">Relic Waves · документы</p>

      <div className="mt-2 space-y-1">
        {docs.map((doc, i) => (
          <div
            key={doc.name}
            className={cn("trust-cab-doc-row flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-2", `trust-cab-doc-row--${i + 1}`)}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <FileText className="size-3 shrink-0 text-neutral-400" aria-hidden />
              <p className="truncate text-[10px] font-medium text-neutral-800">{doc.name}</p>
            </div>
            <span className="shrink-0 rounded bg-neutral-200/80 px-1.5 py-0.5 text-[8px] font-semibold text-neutral-600">{doc.tag}</span>
          </div>
        ))}
      </div>

      <div className="trust-cab-doc-cta mt-auto rounded-lg bg-[#B7F500] py-1.5 text-center text-[9px] font-semibold text-black">
        Открыть data room
      </div>
    </div>
  );
}

export function TrustCabinetVerifyScene() {
  return (
    <div className="trust-cab-scene">
      {/* Мини-профиль */}
      <div className="trust-cab-profile flex items-center gap-2.5 rounded-2xl bg-neutral-50 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white sm:size-11">
          ДК
          <span className="trust-cab-profile-dot absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-neutral-50 bg-emerald-500" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">Дмитрий К.</p>
          <p className="text-[10px] text-neutral-500">Кабинет · Spliton</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-semibold text-emerald-800">
          <ShieldCheck className="size-3" aria-hidden />
          KYC
        </span>
      </div>

      {/* Мини-кабинет */}
      <div className="trust-cab-window mt-4 overflow-hidden rounded-2xl border border-neutral-200/80 bg-[#f6f7f9]">
        <div className="flex h-7 items-center gap-1.5 border-b border-neutral-200/80 bg-white px-3">
          <span className="size-1.5 rounded-full bg-red-400/90" aria-hidden />
          <span className="size-1.5 rounded-full bg-amber-400/90" aria-hidden />
          <span className="size-1.5 rounded-full bg-emerald-400/90" aria-hidden />
          <span className="ml-1 text-[9px] font-medium text-neutral-400">Кабинет · Самопроверка</span>
        </div>
        <div className="relative isolate aspect-[5/4] min-h-[220px] overflow-hidden bg-white sm:min-h-[200px]">
          <HistoryPanel />
          <StatementsPanel />
          <WithdrawalsPanel />
          <DocumentsPanel />
        </div>
      </div>

      {/* Таймлайн */}
      <div className="trust-cab-timeline relative mt-5 sm:mt-6">
        <div
          className="trust-cab-timeline-rail pointer-events-none absolute inset-x-[12.5%] top-[2.05rem] h-[3px] overflow-hidden rounded-full bg-neutral-200 sm:top-[2.35rem]"
          aria-hidden
        >
          <div className="trust-cab-progress h-full rounded-full bg-[#B7F500]" />
        </div>
        <div className="-mx-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          <div className="grid min-w-[18rem] grid-cols-4 gap-0.5 px-1 sm:min-w-0 sm:gap-1">
            {STEPS.map((step, index) => (
              <div key={step.id} className="trust-cab-timeline-step flex flex-col items-center text-center">
                <span
                  className={cn(
                    "trust-cab-tab-label--" + step.id,
                    "relative min-h-7 max-w-[4.25rem] text-[9px] leading-snug sm:min-h-8 sm:max-w-none sm:text-[10px] lg:text-xs",
                  )}
                >
                  <span className="relative inline-block pb-1">
                    {step.label}
                    <span
                      className={cn("trust-cab-underline--" + step.id, "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-[#B7F500]")}
                      aria-hidden
                    />
                  </span>
                </span>
                <div
                  className={cn(
                    "trust-cab-tab-dot trust-cab-tab-dot--" + step.id,
                    "relative z-10 mt-2 flex size-8 items-center justify-center rounded-full font-mono text-[9px] font-bold tabular-nums sm:mt-2.5 sm:size-9 sm:text-[10px]",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Описание активного шага */}
      <div className="relative mt-4 min-h-[6.5rem] sm:mt-5 sm:min-h-24">
        {STEPS.map((step) => (
          <div key={step.id} className={cn("trust-cab-detail--" + step.id, "absolute inset-x-0 top-0")} aria-hidden={step.id !== "history"}>
            <p className="text-[13px] font-semibold text-neutral-900 sm:text-sm">{step.title}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600 sm:text-xs">{step.description}</p>
            <Link
              href={step.href}
              className="trust-cab-link mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 transition hover:text-neutral-600"
            >
              {step.hrefLabel}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-5 flex sm:mt-6 sm:justify-start">
        <Link
          href={ROUTES.dashboardPayoutsHistory}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
        >
          История операций
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
