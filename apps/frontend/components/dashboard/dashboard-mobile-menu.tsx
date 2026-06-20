"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, X } from "@/lib/lucide";
import * as React from "react";

import type { DashboardNavItem } from "@/components/dashboard/dashboard-nav";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const SUPPORT_ICON_SRC = "/images/catalogbuy/2.png";

/** OKX-style mobile drawer rows */
const mobileRowClass =
  "flex w-full items-center justify-between py-3.5 text-[17px] font-medium leading-snug tracking-[-0.01em] text-white transition-colors";
const mobileTopLinkClass =
  "block w-full py-3.5 text-left text-[17px] font-medium leading-snug tracking-[-0.01em] text-white transition-colors hover:text-white/90";
const mobileSubLinkClass =
  "block w-full py-2.5 pl-5 text-left text-[17px] font-normal leading-snug tracking-[-0.01em] text-white/90 transition-colors hover:text-white";

type DashboardMobileMenuProps = {
  open: boolean;
  navItems: DashboardNavItem[];
  pathname: string;
  hash: string;
  onClose: () => void;
  navItemActive: (item: DashboardNavItem, pathname: string, hash: string) => boolean;
  t: (key: string, fallback?: string) => string;
  isAuthenticated: boolean;
  balanceShort: string | null;
  balanceError: string | null;
  depositHref: string;
  loginHref: string;
};

export function DashboardMobileMenu({
  open,
  navItems,
  pathname,
  hash,
  onClose,
  navItemActive,
  t,
  isAuthenticated,
  balanceShort,
  balanceError,
  depositHref,
  loginHref,
}: DashboardMobileMenuProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) setExpandedId(null);
  }, [open]);

  const toggleSection = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] bg-black transition duration-300 sm:hidden",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "relative flex h-dvh min-h-dvh flex-col overflow-y-auto px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] transition-transform duration-300",
          open ? "translate-y-0" : "-translate-y-2",
        )}
        id="mobile-dashboard-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t("navigation.header.mobileMenu")}
        aria-hidden={!open}
      >
        <div className="flex justify-end">
          <button
            type="button"
            className="flex size-10 items-center justify-center text-white transition-colors hover:text-white/80"
            onClick={onClose}
            aria-label={t("navigation.header.mobileMenuClose")}
          >
            <X className="size-[22px]" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <nav className="mt-1 flex flex-col" aria-label={t("navigation.header.mobileNav")}>
          {navItems.map((item) => {
            const isActive = navItemActive(item, pathname, hash);
            const hasChildren = Boolean(item.children?.length);
            const isExpanded = expandedId === item.id;

            if (!hasChildren) {
              return (
                <Link
                  key={`mobile-menu-${item.id}`}
                  href={item.href}
                  onClick={onClose}
                  className={cn(mobileTopLinkClass, isActive && "text-white")}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={`mobile-menu-${item.id}`}>
                <button
                  type="button"
                  className={cn(mobileRowClass, "text-left")}
                  aria-expanded={isExpanded}
                  onClick={() => toggleSection(item.id)}
                >
                  <span className={cn(isActive && "text-white")}>{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-[18px] shrink-0 text-white/70 transition-transform duration-200",
                      isExpanded && "-rotate-180",
                    )}
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
                {isExpanded ? (
                  <div className="pb-1">
                    {item.children!.map((child) => (
                      <Link
                        key={`mobile-sub-${child.href}`}
                        href={child.href}
                        onClick={onClose}
                        className={mobileSubLinkClass}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="mt-4 flex flex-col border-t border-white/8 pt-2">
          {isAuthenticated ? (
            <Link
              href={depositHref}
              onClick={onClose}
              className={cn(mobileRowClass, "hover:text-white/90")}
            >
              <span>{t("nav.balance", "Баланс")}</span>
              <span className="tabular-nums text-white/90">
                {balanceError ? "—" : balanceShort ?? "…"} USDT
              </span>
            </Link>
          ) : null}

          <LanguageSelector
            variant="dark"
            layout="menu"
            buttonClassName="rounded-none px-0 py-3.5 text-[17px] font-medium hover:bg-transparent"
          />

          <Link href={ROUTES.dashboardProfile} onClick={onClose} className={mobileTopLinkClass}>
            {t("navigation.header.profileLink")}
          </Link>

          <Link
            href={isAuthenticated ? depositHref : loginHref}
            onClick={onClose}
            className="mt-4 flex h-12 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-black transition active:scale-[0.98]"
          >
            {isAuthenticated ? t("navigation.header.depositUsdtMobile") : t("navigation.header.login")}
          </Link>
        </div>
      </div>

      <Link
        href={ROUTES.support}
        onClick={onClose}
        aria-label={t("navigation.header.help")}
        className={cn(
          "fixed z-[210] flex size-14 items-center justify-center overflow-hidden rounded-full bg-[#141414] ring-1 ring-white/10 transition active:scale-95 sm:hidden",
          "bottom-[max(1rem,env(safe-area-inset-bottom))] right-4",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <Image
          src={SUPPORT_ICON_SRC}
          alt=""
          width={56}
          height={56}
          className="size-full object-cover"
          unoptimized
        />
      </Link>
    </div>
  );
}
