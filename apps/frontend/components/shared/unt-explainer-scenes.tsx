"use client";

import "./unt-explainer-scenes.css";

import Image from "next/image";
import { ArrowRight, Disc3, Music2, Users } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { UNT_EXPLAINER_RELEASE } from "@/constants/unt-explainer-data";
import { statusLabel } from "@/lib/i18n/status-labels";
import { cn } from "@/lib/utils";

const intFmt = (n: number) => n.toLocaleString("ru-RU");

function SceneChrome({ label }: { label: string }) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/8 bg-zinc-950 px-3">
      <span className="size-2 rounded-full bg-red-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-amber-400/90" aria-hidden />
      <span className="size-2 rounded-full bg-emerald-400/90" aria-hidden />
      <span className="ml-1 truncate text-[10px] font-medium text-zinc-500">{label}</span>
      <span className="unt-scene-live-dot ml-auto size-1.5 rounded-full bg-[#B7F500]" aria-hidden />
    </div>
  );
}

export function UntSceneFrame({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("unt-scene overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/[0.08] sm:rounded-3xl", className)}>
      <SceneChrome label={label} />
      <div className="relative aspect-[16/11] min-h-[240px] overflow-hidden bg-zinc-900 sm:min-h-[280px]">{children}</div>
    </div>
  );
}

export function ReleaseScenePanel() {
  const { locale, t } = useI18n();
  const r = UNT_EXPLAINER_RELEASE;
  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Каталог · релиз</p>
      <div className="mt-3 flex flex-1 gap-3 rounded-xl bg-zinc-950/80 p-3 ring-1 ring-white/8">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-black sm:h-28 sm:w-24">
          <Image src={r.coverUrl} alt="" fill className="object-cover" sizes="96px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="unt-scene-pulse rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              {statusLabel("release", r.status, locale)}
            </span>
            <span className="text-[10px] text-zinc-500">{r.genre}</span>
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-white">{r.title}</p>
          <p className="text-xs text-zinc-400">{r.artist}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>{t("widget.untExplainer.roundRaise")}</span>
              <span className="font-mono text-zinc-300">57%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="unt-scene-progress h-full rounded-full bg-[#B7F500]" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "Всего UNT", value: intFmt(r.totalUnits) },
          { label: "Доступно", value: intFmt(r.availableUnits) },
          { label: "Цена 1 UNT", value: `${r.unitPriceUsdt} $` },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-zinc-950/70 px-2 py-2 ring-1 ring-white/6">
            <p className="text-[9px] text-zinc-500">{item.label}</p>
            <p className="mt-0.5 font-mono text-xs font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PoolScenePanel() {
  const { t } = useI18n();
  const r = UNT_EXPLAINER_RELEASE;
  const userUnits = 1000;
  const sharePct = (userUnits / r.totalUnits) * 100;

  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Пул релиза · {r.title}</p>
      <p className="mt-1 text-sm font-semibold text-white">Пользовательский пул — {r.userPoolPct}% дохода релиза</p>

      <div className="mt-4 rounded-xl bg-zinc-950/80 p-4 ring-1 ring-white/8">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{t("widget.untExplainer.totalUnitsInRelease")}</span>
          <span className="font-mono text-white">{intFmt(r.totalUnits)}</span>
        </div>
        <div className="relative mt-4 h-8 overflow-hidden rounded-lg bg-zinc-800">
          <div className="unt-scene-bar-fill absolute inset-y-0 left-0 rounded-lg bg-[#B7F500]/85" />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-black">
            Ваши {intFmt(userUnits)} UNT · {sharePct.toFixed(0)}%
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          1 000 из 10 000 UNT = 10% пользовательского пула дохода этого релиза. Другой релиз — другой пул.
        </p>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-950/70 px-3 py-2 ring-1 ring-white/6">
          <Music2 className="size-4 text-zinc-500" aria-hidden />
          <div>
            <p className="text-[9px] text-zinc-500">Релиз</p>
            <p className="text-xs font-medium text-zinc-200">Отдельный пул</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-950/70 px-3 py-2 ring-1 ring-white/6">
          <Users className="size-4 text-zinc-500" aria-hidden />
          <div>
            <p className="text-[9px] text-zinc-500">Держатели</p>
            <p className="text-xs font-medium text-zinc-200">Пропорция UNT</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BuyScenePanel() {
  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Первичный рынок</p>
      <p className="mt-1 text-sm font-semibold text-white">Покупка UNT · Midnight Drive</p>

      <div className="mt-4 space-y-2 rounded-xl bg-zinc-950/80 p-3 ring-1 ring-white/8">
        <div className="unt-scene-usdt-out flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2.5">
          <span className="text-xs text-zinc-400">Списание USDT</span>
          <span className="font-mono text-sm font-semibold text-white">− 500,00</span>
        </div>
        <div className="flex items-center justify-center text-zinc-600">
          <ArrowRight className="size-4 rotate-90" aria-hidden />
        </div>
        <div className="unt-scene-unt-in flex items-center justify-between rounded-lg bg-[#B7F500]/10 px-3 py-2.5 ring-1 ring-[#B7F500]/25">
          <span className="text-xs text-[#d4f570]">Зачисление UNT</span>
          <span className="font-mono text-sm font-semibold text-[#d4f570]">+ 10 UNT</span>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-zinc-950/70 px-3 py-2.5 text-[10px] text-zinc-500 ring-1 ring-white/6">
        Platform fee 2,5% · итог в превью ордера до подтверждения
      </div>

      <button type="button" className="mt-auto h-9 rounded-xl bg-[#B7F500] text-xs font-semibold text-black">
        Подтвердить покупку
      </button>
    </div>
  );
}

export function PayoutScenePanel() {
  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Начисления</p>
      <p className="mt-1 text-sm font-semibold text-white">Доход релиза → держатели UNT</p>

      <div className="mt-3 rounded-xl bg-zinc-950/80 px-3 py-3 ring-1 ring-white/8">
        <p className="text-[10px] text-zinc-500">Доход релиза (пример)</p>
        <p className="font-mono text-lg font-semibold text-white">1 000 USDT</p>
        <p className="mt-1 text-[10px] text-zinc-500">Пользовательский пул 50% → 500 USDT к распределению</p>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="unt-scene-payout-user flex items-center justify-between rounded-lg bg-zinc-950/80 px-3 py-2 ring-1 ring-white/8">
          <span className="text-xs text-zinc-300">Вы · 1 000 UNT (10%)</span>
          <span className="font-mono text-xs font-semibold text-[#d4f570]">+ 50 USDT</span>
        </div>
        <div className="unt-scene-payout-others flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-2 opacity-80">
          <span className="text-xs text-zinc-500">Другие держатели</span>
          <span className="font-mono text-xs text-zinc-400">+ 450 USDT</span>
        </div>
      </div>

      <p className="mt-auto text-center text-[10px] text-zinc-600">Выплаты зависят от фактического дохода релиза</p>
    </div>
  );
}

export function SecondaryScenePanel() {
  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Secondary market</p>
      <p className="mt-1 text-sm font-semibold text-white">Передача UNT между пользователями</p>

      <div className="mt-6 flex items-center justify-between gap-3 px-2">
        <div className="unt-scene-transfer-from flex-1 rounded-xl bg-zinc-950/80 px-3 py-4 text-center ring-1 ring-white/8">
          <Disc3 className="mx-auto size-5 text-zinc-500" aria-hidden />
          <p className="mt-2 text-[10px] text-zinc-500">Продавец</p>
          <p className="font-mono text-sm font-semibold text-white">200 UNT</p>
        </div>

        <div className="unt-scene-transfer-arrow flex flex-col items-center gap-1 text-[#B7F500]">
          <ArrowRight className="size-5" aria-hidden />
          <span className="text-[9px] font-medium">Сделка</span>
        </div>

        <div className="unt-scene-transfer-to flex-1 rounded-xl bg-zinc-950/80 px-3 py-4 text-center ring-1 ring-[#B7F500]/20">
          <Disc3 className="mx-auto size-5 text-[#d4f570]" aria-hidden />
          <p className="mt-2 text-[10px] text-zinc-500">Покупатель</p>
          <p className="font-mono text-sm font-semibold text-[#d4f570]">+ 200 UNT</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-zinc-950/70 px-3 py-2.5 text-[10px] leading-relaxed text-zinc-500 ring-1 ring-white/6">
        Secondary fee удерживается при исполнении. Право на будущие начисления переходит вместе с UNT.
      </div>
    </div>
  );
}

export const UNT_SCENE_PANELS = {
  release: ReleaseScenePanel,
  pool: PoolScenePanel,
  buy: BuyScenePanel,
  payout: PayoutScenePanel,
  secondary: SecondaryScenePanel,
} as const;
