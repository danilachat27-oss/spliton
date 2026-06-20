"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DashboardSectionSubheaderShell } from "@/components/dashboard/dashboard-section-subheader-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const supportHeaderItems: Array<{
  href: string;
  labelKey: string;
  supportRoot?: boolean;
}> = [{ href: ROUTES.support, labelKey: "support.nav.support", supportRoot: true }];

function isSupportNavActive(pathname: string, item: (typeof supportHeaderItems)[number]) {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = item.href.replace(/\/$/, "");
  if (item.supportRoot) {
    return p === ROUTES.support;
  }
  return p === h || p.startsWith(`${h}/`);
}

/** Второй ряд навигации — как `PayoutsSectionHeader` на `/assets/payouts/history`. */
export function SupportSectionHeader() {
  const { t } = useI18n();
  const pathname = usePathname() ?? "";

  return (
    <DashboardSectionSubheaderShell variant="muted">
      <nav
        aria-label={t("support.nav.aria")}
        className="flex h-9 items-end gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {supportHeaderItems.map((item) => {
          const active = isSupportNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-full items-center border-b-2 px-0.5 text-[12px] font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800",
              )}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </DashboardSectionSubheaderShell>
  );
}
