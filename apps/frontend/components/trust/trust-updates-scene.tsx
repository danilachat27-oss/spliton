"use client";

import "./trust-updates-scene.css";

import { Check } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "ledger",
    label: "Запуск ledger",
    shortLabel: "Ledger",
    date: "янв. 2026 г.",
    title: "Единый учёт операций",
    description:
      "Внутренний ledger фиксирует пополнения, сделки и выводы в USDT. Каждая запись связана с типом операции и счётом пользователя.",
  },
  {
    id: "status",
    label: "Публичный статус",
    shortLabel: "Статус",
    date: "март 2026 г.",
    title: "Открытая страница статуса",
    description:
      "Инциденты, деградации и плановые работы публикуются отдельно — состояние торгов, выплат и кабинета в одном месте.",
  },
  {
    id: "disputes",
    label: "Центр споров",
    shortLabel: "Споры",
    date: "май 2026 г.",
    title: "Спорные финансовые кейсы",
    description:
      "Пользователи могут передать торговые и финансовые обращения в центр споров с фиксацией статуса рассмотрения.",
  },
  {
    id: "trust",
    label: "Центр доверия",
    shortLabel: "Доверие",
    date: "июн. 2026 г.",
    title: "Прозрачность в одном разделе",
    description:
      "Публичная страница о контролях treasury, compliance, документах и самопроверке в кабинете — без инвестиционных обещаний.",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/** Статичная галочка — только у подтверждённых записей, без анимации. */
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

function DrawnCheckmark({ step }: { step: StepId }) {
  return (
    <div className={cn("relative grid size-6 shrink-0 place-items-center", `trust-upd-check-wrap--${step}`)} aria-hidden>
      <svg width={24} height={24} viewBox="0 0 52 52" className="relative z-1">
        <circle
          className={cn("trust-upd-check-circle", `trust-upd-check-circle--${step}`)}
          cx="26"
          cy="26"
          r="23"
          fill="rgb(236 253 245)"
          stroke="rgb(16 185 129)"
          strokeWidth="2.5"
        />
        <path
          className={cn("trust-upd-check-path", `trust-upd-check-path--${step}`)}
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

function MiniChrome({ title }: { title: string }) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-2 border-b border-neutral-200/80 bg-white px-3">
      <span className="size-2 rounded-full bg-red-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-amber-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-emerald-400/90" aria-hidden />
      <span className="ml-1 truncate text-[10px] font-medium text-neutral-400">{title}</span>
      <span className="trust-upd-live-dot ml-auto size-1.5 rounded-full bg-[#B7F500]" aria-hidden />
    </div>
  );
}

function FlowCursor({ step, hint, className }: { step: StepId; hint: string; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute z-30", className)} aria-hidden>
      <div className={cn("trust-upd-cursor relative", `trust-upd-cursor--${step}`)}>
        <svg width="16" height="18" viewBox="0 0 14 16" className="drop-shadow-md">
          <path d="M1 1L1 13.5L4.2 10.3L6.5 15.5L8.2 14.7L5.9 9.5L10.5 9.5L1 1Z" fill="white" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        <span className={cn("trust-upd-ring absolute left-1.5 top-1.5 size-3 rounded-full border-2 border-[#B7F500]/90", `trust-upd-ring--${step}`)} />
        <span className={cn("trust-upd-tip absolute left-4 top-3 whitespace-nowrap rounded-md bg-neutral-900 px-1.5 py-0.5 text-[9px] font-medium text-white shadow-lg", `trust-upd-tip--${step}`)}>
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
  className,
  confirmed = true,
}: {
  step: StepId;
  title: string;
  subtitle: string;
  className?: string;
  /** Галочка только у завершённых этапов (запуск, публикация). */
  confirmed?: boolean;
}) {
  return (
    <div
      className={cn(
        "trust-upd-toast pointer-events-none absolute z-20 flex items-start gap-2 rounded-xl border px-3 py-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]",
        confirmed ? "border-emerald-200/80 bg-emerald-50" : "border-amber-200/80 bg-amber-50",
        `trust-upd-toast--${step}`,
        className,
      )}
      aria-hidden
    >
      {confirmed ? (
        <DrawnCheckmark step={step} />
      ) : (
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
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
        "trust-upd-spinner pointer-events-none absolute z-20 flex items-center gap-2 rounded-xl border border-neutral-200/60 bg-white/95 px-3 py-2 shadow-sm",
        `trust-upd-spinner--${step}`,
        className,
      )}
      aria-hidden
    >
      <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
      <span className="text-[10px] font-medium text-neutral-700">{label}</span>
    </div>
  );
}

function LedgerPanel() {
  const { t } = useI18n();

  return (
    <div className="trust-upd-panel trust-upd-panel--ledger pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="ledger"
        title={t("trust.scene.updates.toast.ledger.title")}
        subtitle={t("trust.scene.updates.toast.ledger.subtitle")}
        className="right-3 top-3 w-44 sm:right-4"
      />
      <SceneSpinner step="ledger" label="Инициализация ledger…" className="left-4 top-14 sm:left-6" />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">2026 · Ledger</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">Единый учёт операций</p>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2.5">
        <p className="text-[10px] text-neutral-500">Сводка по счёту</p>
        <p className="font-mono text-lg font-semibold tabular-nums text-neutral-900">1 500,00 USDT</p>
        <p className="mt-0.5 text-[9px] text-neutral-500">3 записи · аудит включён</p>
      </div>

      <div className="relative mt-3 min-h-0 flex-1 space-y-1.5">
        <div className="trust-upd-ledger-entry trust-upd-ledger-entry--1 rounded-xl bg-neutral-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-neutral-700">deposit · TRC20</span>
            <span className="font-mono font-semibold text-emerald-700">+500,00</span>
          </div>
          <p className="mt-0.5 font-mono text-[9px] text-neutral-500">#0001 · 12 янв. · tx 0x8f…c21</p>
        </div>
        <div className="trust-upd-ledger-entry trust-upd-ledger-entry--2 relative rounded-xl bg-neutral-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1 font-medium text-neutral-800">
              <DoneIcon />
              trade · Relic Waves
            </span>
            <span className="font-mono font-semibold text-neutral-800">−681,80</span>
          </div>
          <p className="mt-0.5 font-mono text-[9px] text-neutral-500">#0002 · 14 янв. · исполнено</p>
          <FlowCursor step="ledger" hint="Запись" className="right-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="trust-upd-ledger-entry trust-upd-ledger-entry--3 rounded-xl bg-neutral-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-neutral-600">accrual · Q1</span>
            <span className="font-mono font-semibold text-emerald-600">+12,40</span>
          </div>
          <p className="mt-0.5 font-mono text-[9px] text-neutral-400">#0003 · ожидает релиза</p>
        </div>
      </div>
    </div>
  );
}

function StatusPanel() {
  const { t } = useI18n();
  const services = [
    { id: "trading", name: "Торги", detail: "Первичный и вторичный рынок", status: "Работает" },
    { id: "payouts", name: "Выплаты", detail: "Treasury · TRC20", status: "Работает" },
    { id: "cabinet", name: "Кабинет", detail: "Баланс и история", status: "Работает" },
  ] as const;

  return (
    <div className="trust-upd-panel trust-upd-panel--status pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="status"
        title={t("trust.scene.updates.toast.status.title")}
        subtitle={t("trust.scene.updates.toast.status.subtitle")}
        className="right-3 top-3 w-44 sm:right-4"
      />
      <SceneSpinner step="status" label="Синхронизация статуса…" className="left-4 top-14 sm:left-6" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">2026 · Статус</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">Публичная страница</p>
        </div>
        <div className="trust-upd-status-badge shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-semibold text-emerald-800">
          Operational
        </div>
      </div>

      <div className="trust-upd-status-hero relative mt-3 rounded-2xl bg-neutral-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="trust-upd-status-pulse size-2 rounded-full bg-emerald-500" aria-hidden />
          <p className="text-xs font-semibold text-neutral-900">Все системы работают штатно</p>
        </div>
        <p className="mt-1 text-[10px] text-neutral-500">Последнее обновление · 14:32 UTC · март 2026</p>
      </div>

      <div className="mt-3 space-y-1.5">
        {services.map((svc) => (
          <div
            key={svc.id}
            className={cn(
              "trust-upd-status-row trust-upd-status-row--" + svc.id,
              "relative flex items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2.5",
            )}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-900">{svc.name}</p>
              <p className="truncate text-[9px] text-neutral-500">{svc.detail}</p>
            </div>
            <span className={cn("trust-upd-status-chip trust-upd-status-chip--" + svc.id, "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold")}>
              {svc.status}
            </span>
            {svc.id === "trading" ? (
              <FlowCursor step="status" hint="Статус" className="right-2 top-1/2 -translate-y-1/2" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function DisputesPanel() {
  const { t } = useI18n();

  return (
    <div className="trust-upd-panel trust-upd-panel--disputes pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="disputes"
        title={t("trust.scene.updates.toast.disputes.title")}
        subtitle={t("trust.scene.updates.toast.disputes.subtitle")}
        confirmed={false}
        className="right-3 top-3 w-44 sm:right-4"
      />
      <SceneSpinner step="disputes" label="Регистрация спора…" className="left-4 top-14 sm:left-6" />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">2026 · Споры</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">Центр споров</p>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-neutral-500">Новое обращение</span>
          <span className="font-mono text-neutral-600">DS-2026-041</span>
        </div>
      </div>

      <div className="trust-upd-dispute-card relative mt-2 rounded-2xl bg-neutral-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Тема</p>
        <p className="mt-1 text-xs font-medium text-neutral-900">Расхождение по выводу USDT</p>

        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-white px-2.5 py-2">
            <p className="text-[9px] text-neutral-500">Сумма в споре</p>
            <p className="font-mono text-sm font-semibold text-neutral-900">200,00 USDT</p>
          </div>
          <div className="rounded-lg bg-white px-2.5 py-2">
            <p className="text-[9px] text-neutral-500">Категория</p>
            <p className="text-[10px] font-medium text-neutral-800">Вывод · TRC20</p>
          </div>
        </div>

        <div className="trust-upd-dispute-steps mt-3 flex items-center gap-1">
          {["Принято", "Проверка", "Ответ"].map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <span className={cn("trust-upd-dispute-step trust-upd-dispute-step--" + (i + 1), "flex size-5 items-center justify-center rounded-full text-[8px] font-bold")}>
                {i + 1}
              </span>
              <span className="text-[8px] text-neutral-500">{label}</span>
            </div>
          ))}
        </div>

        <p className="trust-upd-dispute-status relative mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-semibold text-amber-900">
          На рассмотрении
          <FlowCursor step="disputes" hint="Спор" className="left-[calc(100%+0.35rem)] top-1/2 -translate-y-1/2" />
        </p>
      </div>
    </div>
  );
}

function TrustPanel() {
  const { t } = useI18n();
  const blocks = [
    { id: "ledger", label: "Ledger", value: "Аудит", hint: "Каждая операция" },
    { id: "treasury", label: "Treasury", value: "Контроль", hint: "Выводы и резервы" },
    { id: "status", label: "Статус", value: "Публичный", hint: "Инциденты онлайн" },
    { id: "docs", label: "Документы", value: "Открыты", hint: "Политики и условия" },
  ] as const;

  return (
    <div className="trust-upd-panel trust-upd-panel--trust pointer-events-none absolute inset-0 flex flex-col px-4 py-4 sm:px-6 sm:py-5">
      <SceneToast
        step="trust"
        title={t("trust.scene.updates.toast.trust.title")}
        subtitle={t("trust.scene.updates.toast.trust.subtitle")}
        className="right-3 top-3 w-44 sm:right-4"
      />
      <SceneSpinner step="trust" label="Публикация раздела…" className="left-4 top-14 sm:left-6" />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">2026 · Доверие</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">Центр доверия Spliton</p>

      <div className="trust-upd-trust-hero relative mt-3 rounded-2xl bg-neutral-900 px-4 py-3 text-white">
        <p className="text-[10px] font-medium text-neutral-400">Прозрачность платформы</p>
        <p className="mt-1 text-xs font-semibold">Контроли · статус · документы</p>
        <div className="mt-2 flex gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px]">Compliance</span>
          <span className="rounded-full bg-[#B7F500]/20 px-2 py-0.5 text-[9px] text-[#B7F500]">Self-check</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {blocks.map((b) => (
          <div key={b.id} className={cn("trust-upd-trust-card trust-upd-trust-card--" + b.id, "relative overflow-hidden rounded-xl bg-neutral-50 px-2.5 py-2.5")}>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">{b.label}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-neutral-900">{b.value}</p>
            <p className="mt-1 text-[8px] leading-snug text-neutral-500">{b.hint}</p>
          </div>
        ))}
      </div>

      <div className="trust-upd-trust-cta relative mt-3 rounded-xl bg-neutral-900 py-2.5 text-center text-[10px] font-semibold text-white">
        Открыть центр доверия
        <FlowCursor step="trust" hint="Доверие" className="left-[58%] top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}

export function TrustUpdatesScene() {
  const { t } = useI18n();

  return (
    <section className="trust-upd-scene rounded-2xl bg-white px-4 py-6 sm:rounded-3xl sm:px-8 sm:py-10" aria-labelledby="trust-updates-heading">
      <div className="text-center">
        <h2 id="trust-updates-heading" className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl lg:text-3xl">
          Что нового в центре доверия
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-neutral-600 sm:text-sm">
          Ключевые шаги прозрачности в 2026 году — от ledger до публичного раздела.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl bg-[#f6f7f9] sm:mt-10 sm:rounded-3xl">
        <MiniChrome title={t("trust.scene.updates.chrome")} />
        <div className="relative isolate min-h-[320px] overflow-hidden bg-white sm:min-h-[360px] lg:min-h-[380px]">
          <LedgerPanel />
          <StatusPanel />
          <DisputesPanel />
          <TrustPanel />
        </div>
      </div>

      <div className="relative mx-auto mt-8 max-w-3xl sm:mt-12">
        <div className="pointer-events-none absolute left-6 right-6 top-[2.35rem] hidden h-px bg-neutral-200 sm:top-[2.65rem] sm:block" aria-hidden>
          <div className="trust-upd-progress h-full bg-[#B7F500]" />
        </div>
        <div className="-mx-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          <div className="grid min-w-[19rem] grid-cols-4 gap-1 px-1 sm:min-w-0 sm:gap-2">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center text-center">
                <span className={cn("trust-upd-step-label--" + step.id, "relative min-h-8 max-w-[4.5rem] text-[10px] leading-snug sm:min-h-10 sm:max-w-36 sm:text-sm")}>
                  <span className="relative inline-block pb-1">
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className={cn("trust-upd-underline--" + step.id, "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-[#B7F500]")} aria-hidden />
                  </span>
                </span>
                <div
                  className={cn(
                    "trust-upd-step-dot trust-upd-step-dot--" + step.id,
                    "mt-2 flex size-8 items-center justify-center rounded-full text-[10px] font-bold sm:mt-3 sm:size-9 sm:text-xs",
                  )}
                >
                  {STEPS.findIndex((s) => s.id === step.id) + 1}
                </div>
                <span className="mt-1.5 text-[10px] text-neutral-500 sm:mt-2 sm:text-xs lg:text-sm">{step.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-8 min-h-[8.5rem] max-w-2xl text-center sm:mt-12 sm:min-h-30">
        {STEPS.map((step) => (
          <div key={step.id} className={cn("trust-upd-detail--" + step.id, "absolute inset-x-0 top-0 px-1 sm:px-0")} aria-hidden={step.id !== "ledger"}>
            <p className="text-xs text-neutral-500 sm:text-sm">{step.date}</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl lg:text-2xl">{step.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 sm:mt-3 sm:text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
