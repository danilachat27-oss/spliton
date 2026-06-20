"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import type { EligibilityAccessRow } from "@/lib/profile/eligibility-access";
import { cn } from "@/lib/utils";

function statusTone(status: EligibilityAccessRow["status"]): string {
  switch (status) {
    case "allowed":
      return "text-[#3d7a00]";
    case "limited":
      return "text-amber-700";
    case "kyc_required":
    case "legal_required":
    case "email_required":
      return "text-amber-800";
    default:
      return "text-red-700";
  }
}

export function ProfileEligibilityRows({ rows }: { rows: EligibilityAccessRow[] }) {
  const { t } = useI18n();

  const statusLabel = (status: EligibilityAccessRow["status"]) =>
    t(`verification.eligibility.status.${status}`);

  return (
    <>
      <ul className="mt-4 divide-y divide-neutral-100 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-neutral-900">{t(row.labelKey)}</p>
                {row.message ? (
                  <p className="mt-0.5 text-[12px] text-neutral-500">{row.message}</p>
                ) : null}
                <p className={cn("mt-1 text-[13px] font-semibold", statusTone(row.status))}>
                  {statusLabel(row.status)}
                </p>
              </div>
              {row.ctaHref && row.ctaLabelKey ? (
                <Link
                  href={row.ctaHref}
                  className="shrink-0 text-[12px] font-semibold text-neutral-800 underline-offset-2 hover:underline"
                >
                  {t(row.ctaLabelKey)}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 hidden overflow-x-auto rounded-xl bg-neutral-50/80 md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              <th className="px-3 py-3 pl-4 font-medium">{t("verification.table.operation")}</th>
              <th className="px-3 py-3 font-medium">{t("verification.eligibility.table.status")}</th>
              <th className="px-3 py-3 font-medium">{t("verification.eligibility.table.details")}</th>
              <th className="px-3 py-3 pr-4 text-right font-medium" />
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((row, i) => (
              <tr key={row.id} className={cn(i !== rows.length - 1 && "border-b border-neutral-100")}>
                <td className="px-3 py-3 pl-4 font-medium text-neutral-900">{t(row.labelKey)}</td>
                <td className={cn("px-3 py-3 font-medium", statusTone(row.status))}>
                  {statusLabel(row.status)}
                </td>
                <td className="px-3 py-3 text-xs text-neutral-500">{row.message ?? "—"}</td>
                <td className="px-3 py-3 pr-4 text-right">
                  {row.ctaHref && row.ctaLabelKey ? (
                    <Link
                      href={row.ctaHref}
                      className="text-xs font-semibold text-neutral-800 hover:text-neutral-950"
                    >
                      {t(row.ctaLabelKey)}
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
