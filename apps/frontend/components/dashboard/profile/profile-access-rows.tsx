"use client";



import { useI18n } from "@/components/providers/i18n-provider";

import { cn } from "@/lib/utils";



type AccessRow = {

  id: string;

  label: string;

  hint: string;

  before: "full" | "limited" | "none";

  after: "full" | "limited" | "none";

};



function accessTone(level: AccessRow["before"]): string {

  if (level === "full") return "text-[#3d7a00]";

  if (level === "limited") return "text-amber-700";

  return "text-neutral-400";

}



export function ProfileAccessRows({ rows }: { rows: AccessRow[] }) {

  const { t } = useI18n();



  const accessLabel = (level: AccessRow["before"]) => {

    if (level === "full") return t("verification.access.full");

    if (level === "limited") return t("verification.access.limited");

    return t("verification.access.none");

  };



  return (

    <>

      <ul className="mt-4 divide-y divide-neutral-100 md:hidden">

        {rows.map((row) => (

          <li key={row.id} className="py-3.5">

            <p className="text-[15px] font-medium text-neutral-900">{row.label}</p>

            {row.hint ? <p className="mt-0.5 text-[12px] text-neutral-500">{row.hint}</p> : null}

            <div className="mt-2 flex items-center justify-between gap-3 text-[13px]">

              <span className="text-neutral-500">

                {t("verification.table.now")}:{" "}

                <span className={cn("font-semibold", accessTone(row.before))}>{accessLabel(row.before)}</span>

              </span>

              <span className="text-neutral-500">

                {t("verification.table.after")}:{" "}

                <span className={cn("font-semibold", accessTone(row.after))}>{accessLabel(row.after)}</span>

              </span>

            </div>

          </li>

        ))}

      </ul>



      <div className="mt-4 hidden overflow-x-auto rounded-xl bg-neutral-50/80 md:block">

        <table className="w-full min-w-[520px] text-left text-sm">

          <thead>

            <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">

              <th className="px-3 py-3 pl-4 font-medium">{t("verification.table.operation")}</th>

              <th className="px-3 py-3 font-medium">{t("verification.table.now")}</th>

              <th className="px-3 py-3 pr-4 font-medium">{t("verification.table.after")}</th>

            </tr>

          </thead>

          <tbody className="bg-white">

            {rows.map((row, i) => (

              <tr key={row.id} className={cn(i !== rows.length - 1 && "border-b border-neutral-100")}>

                <td className="px-3 py-3 pl-4">

                  <p className="font-medium text-neutral-900">{row.label}</p>

                  {row.hint ? <p className="text-xs text-neutral-500">{row.hint}</p> : null}

                </td>

                <td className={cn("px-3 py-3 font-medium", accessTone(row.before))}>{accessLabel(row.before)}</td>

                <td className={cn("px-3 py-3 pr-4 font-medium", accessTone(row.after))}>{accessLabel(row.after)}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </>

  );

}


