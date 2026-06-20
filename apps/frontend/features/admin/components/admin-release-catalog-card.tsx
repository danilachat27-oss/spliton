"use client";



import type { ReactNode } from "react";

import { CheckCircle2, PauseCircle, PencilLine, PlayCircle } from "@/lib/lucide";



import { MediaPlaceholder } from "@/components/dashboard/dashboard-media-placeholder";

import {

  catalogPreviewFromRelease,

  releasePhaseLabelForLocale,

  releaseStatusLabelForLocale,

} from "@/features/admin/lib/admin-release-labels";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

import type { AdminReleaseRow } from "@/features/admin/mocks/admin-data";

import { cn } from "@/lib/utils";



const cardShell =

  "group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#0a0a0a] p-5 font-mono text-[13px] tabular-nums tracking-tight shadow-[0_14px_34px_rgba(0,0,0,0.35)] transition-colors duration-200 hover:bg-[#101010] sm:p-6";



const statusPill: Record<AdminReleaseRow["status"], string> = {

  listed: "bg-emerald-500/12 text-emerald-200/95",

  paused: "bg-amber-500/12 text-amber-200/95",

  draft: "bg-zinc-500/20 text-zinc-300",

  settled: "bg-zinc-600/25 text-zinc-400",

};



function StatusIcon({ status }: { status: AdminReleaseRow["status"] }) {

  if (status === "listed") return <PlayCircle className="size-4 text-emerald-400/85" aria-hidden />;

  if (status === "paused") return <PauseCircle className="size-4 text-amber-400/85" aria-hidden />;

  if (status === "settled") return <CheckCircle2 className="size-4 text-zinc-400/90" aria-hidden />;

  return <PencilLine className="size-4 text-zinc-500" aria-hidden />;

}



function StatRow({ label, children }: { label: string; children: ReactNode }) {

  return (

    <div className="flex items-start justify-between gap-4">

      <dt className="max-w-[55%] text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</dt>

      <dd className="min-w-0 text-right font-sans text-sm text-zinc-100">{children}</dd>

    </div>

  );

}



type AdminReleaseCatalogCardProps = {

  release: AdminReleaseRow;

  onEdit: (r: AdminReleaseRow) => void;

};



export function AdminReleaseCatalogCard({ release: r, onEdit }: AdminReleaseCatalogCardProps) {

  const a = useAdminI18n();

  const pv = catalogPreviewFromRelease(r);

  const trackStatus = r.status;



  return (

    <article className={cardShell}>

      <div className="flex gap-4 sm:gap-5">

        <div

          className={cn(

            "relative shrink-0 overflow-hidden rounded-2xl bg-zinc-950",

            "size-[88px] sm:size-[100px]",

          )}

        >

          {r.coverDataUrl ? (

            <img src={r.coverDataUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />

          ) : (

            <MediaPlaceholder

              label={a.t("admin.release.catalog.asset")}

              frameless

              aspectClassName="absolute inset-0 h-full w-full min-h-0"

            />

          )}

        </div>



        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">

          <div className="flex items-center justify-between gap-3">

            <div className="flex min-w-0 items-center gap-2">

              <StatusIcon status={trackStatus} />

              <span className="truncate font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-400">

                {pv.strip}

              </span>

            </div>

            <span className="shrink-0 rounded-md bg-zinc-800/90 px-2 py-1 font-mono text-[11px] font-semibold tabular-nums tracking-wide text-zinc-200">

              {r.ticker}

            </span>

          </div>



          <div className="font-sans">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{r.genre}</p>

            <h3 className="mt-2 truncate text-xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-[1.35rem]">

              {r.title}

            </h3>

            <p className="mt-1.5 truncate text-sm font-medium text-zinc-400">{r.artistLabel}</p>

          </div>

        </div>

      </div>



      {(r.galleryDataUrls?.length ?? 0) > 0 ? (

        <div className="mt-3 flex flex-wrap gap-2" aria-label={a.t("admin.release.catalog.galleryAria")}>

          {r.galleryDataUrls!.map((url, i) => (

            <div

              key={`g-${r.id}-${i}`}

              className="relative h-11 w-11 overflow-hidden rounded-lg bg-zinc-900 sm:h-12 sm:w-12"

            >

              <img src={url} alt="" className="h-full w-full object-cover" />

            </div>

          ))}

        </div>

      ) : null}



      <p className="mt-5 font-sans text-[12px] leading-relaxed text-zinc-500 sm:mt-6">{pv.detail}</p>



      <dl className="mt-5 space-y-2.5 sm:mt-6">

        <StatRow label={a.t("admin.release.catalog.crmStatus")}>

          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusPill[r.status])}>

            {releaseStatusLabelForLocale(r.status, a.locale)}

          </span>

        </StatRow>

        <StatRow label={a.t("admin.release.catalog.productPhase")}>

          {releasePhaseLabelForLocale(r.phase, a.locale)}

        </StatRow>

        <StatRow label={a.t("admin.release.media.coverLabel")}>

          {r.coverDataUrl ? a.t("admin.release.catalog.coverUploaded") : a.t("admin.release.catalog.coverMissing")}

        </StatRow>

        <StatRow label={a.t("admin.release.catalog.galleryCount")}>{String(r.galleryDataUrls?.length ?? 0)}</StatRow>

        <StatRow label={a.t("admin.release.catalog.goalUsdt")}>{r.goalUsdt}</StatRow>

        <StatRow label={a.t("admin.release.catalog.raisedUsdt")}>{r.raisedUsdt}</StatRow>

        <StatRow label={a.t("admin.release.catalog.unitsOutstanding")}>{r.unitsOutstanding}</StatRow>

        <StatRow label={a.t("admin.release.catalog.unitPrice")}>{r.unitPriceUsdt}</StatRow>

        <StatRow label={a.t("admin.release.catalog.forecastYield")}>{r.forecastYieldPct}</StatRow>

        <StatRow label={a.t("admin.release.catalog.poolShare")}>{r.investorPoolRemainingPct}</StatRow>

        <StatRow label={a.t("admin.release.catalog.updated")}>{r.updatedAt}</StatRow>

        <StatRow label={a.table.id}>

          <span className="font-mono text-[11px] text-zinc-500">{r.id}</span>

        </StatRow>

      </dl>



      <div className="mt-5 flex flex-wrap gap-2">

        <button

          type="button"

          onClick={() => onEdit(r)}

          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900/80 px-4 font-sans text-[13px] font-semibold text-zinc-950 transition hover:bg-zinc-200 sm:flex-none sm:min-w-[140px]"

        >

          <PencilLine className="size-4" aria-hidden />

          {a.t("admin.release.catalog.edit")}

        </button>

      </div>

    </article>

  );

}


