"use client";

import type { PositionPreviewItem } from "@/components/dashboard/assets/assets-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";

export function PositionsChangesCard({ rows }: { rows: PositionPreviewItem[] }) {
  const { t } = useI18n();

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{t("positions.changes.title")}</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-wide">{t("positions.changes.colName")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-neutral-50">
                <td className="px-3.5 py-2.5 font-medium text-neutral-900">{row.release}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
