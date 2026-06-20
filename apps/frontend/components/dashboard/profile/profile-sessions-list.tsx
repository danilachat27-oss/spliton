"use client";

import { Laptop, Smartphone } from "@/lib/lucide";

import type { SecuritySessionRow } from "@/constants/dashboard/profile-security";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function ProfileSessionsList({
  sessions,
  onRevoke,
  live = true,
}: {
  sessions: SecuritySessionRow[];
  onRevoke: (id: string) => void;
  live?: boolean;
}) {
  const { t } = useI18n();

  if (sessions.length === 0) {
    return (
      <p className="mt-4 py-6 text-center text-sm text-neutral-500">
        {t("profile.security.sessions.empty")}
      </p>
    );
  }

  return (
    <>
      <ul className="mt-4 divide-y divide-neutral-100 md:hidden">
        {sessions.map((row) => (
          <li key={row.id} className="flex items-start justify-between gap-3 py-3.5">
            <div className="flex min-w-0 gap-3">
              {row.device.includes("iPhone") ? (
                <Smartphone className="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden />
              ) : (
                <Laptop className="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-medium text-neutral-900">{row.device}</p>
                  {row.current ? (
                    <span className="rounded-full bg-[#B7F500]/20 px-2 py-0.5 text-[10px] font-semibold text-[#3d7a00]">
                      {t("profile.security.sessions.current")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[12px] text-neutral-500">
                  {row.location} · {row.ip}
                </p>
                <p className="mt-0.5 text-[12px] text-neutral-400">{row.lastActive}</p>
              </div>
            </div>
            {!row.current && live ? (
              <button
                type="button"
                onClick={() => onRevoke(row.id)}
                className="shrink-0 text-[13px] font-semibold text-red-700"
              >
                {t("profile.security.sessions.revoke")}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-4 hidden overflow-x-auto rounded-xl bg-neutral-50/80 md:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              <th className="px-3 py-3 pl-4 font-medium">{t("profile.security.sessions.device")}</th>
              <th className="px-3 py-3 font-medium">{t("profile.security.sessions.location")}</th>
              <th className="px-3 py-3 font-medium">{t("profile.security.sessions.ip")}</th>
              <th className="px-3 py-3 font-medium">{t("profile.security.sessions.activity")}</th>
              <th className="px-3 py-3 pr-4 text-right font-medium" />
            </tr>
          </thead>
          <tbody className="bg-white">
            {sessions.map((row, i) => (
              <tr key={row.id} className={cn(i !== sessions.length - 1 && "border-b border-neutral-100")}>
                <td className="px-3 py-3 pl-4">
                  <div className="flex items-center gap-2">
                    {row.device.includes("iPhone") ? (
                      <Smartphone className="size-4 text-neutral-400" aria-hidden />
                    ) : (
                      <Laptop className="size-4 text-neutral-400" aria-hidden />
                    )}
                    <span className="font-medium text-neutral-900">{row.device}</span>
                    {row.current ? (
                      <span className="rounded-md bg-lime-100/90 px-1.5 py-0.5 text-[10px] font-semibold text-lime-950">
                        {t("profile.security.sessions.current")}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-3 text-neutral-600">{row.location}</td>
                <td className="px-3 py-3 font-mono text-xs text-neutral-500">{row.ip}</td>
                <td className="px-3 py-3 text-neutral-600">{row.lastActive}</td>
                <td className="px-3 py-3 pr-4 text-right">
                  {!row.current && live ? (
                    <button
                      type="button"
                      onClick={() => onRevoke(row.id)}
                      className="text-xs font-semibold text-red-700 hover:text-red-800"
                    >
                      {t("profile.security.sessions.revoke")}
                    </button>
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
