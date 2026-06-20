"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, LogOut, X } from "@/lib/lucide";
import * as React from "react";

import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const DEPOSIT_HREF = `${ROUTES.dashboardPayouts}/deposit`;

const menuRowClass =
  "block w-full py-3.5 text-left text-[17px] font-medium leading-snug tracking-[-0.01em] text-white transition-colors hover:text-white/90";
const subMenuRowClass =
  "block w-full py-2.5 pl-5 text-left text-[17px] font-normal leading-snug tracking-[-0.01em] text-white/90 transition-colors hover:text-white";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] ?? ""}***@${domain}`;
  return `${local.slice(0, 3)}***@${domain}`;
}

function userInitial(email: string, displayName: string | null | undefined): string {
  const fromName = displayName?.trim()?.[0];
  if (fromName) return fromName.toUpperCase();
  return (email[0] ?? "S").toUpperCase();
}

type DashboardMobileProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function DashboardMobileProfileDrawer({ open, onClose }: DashboardMobileProfileDrawerProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [assetsOpen, setAssetsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setAssetsOpen(false);
      setCopied(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !user) return null;

  const email = user.email;
  const uid = user.id;
  const initial = userInitial(email, user.profile?.displayName);

  const profileLinks = [
    { href: profileDashboardHref("overview"), label: t("mobileProfile.profile") },
    { href: profileDashboardHref("security"), label: t("navigation.profile.security.label") },
    { href: profileDashboardHref("verification"), label: t("navigation.profile.verification.label") },
    { href: profileDashboardHref("settings"), label: t("navigation.profile.settings.label") },
    { href: profileDashboardHref("legal"), label: t("mobileProfile.legal") },
    { href: ROUTES.dashboardDocuments, label: t("mobileProfile.documents") },
  ];

  const assetLinks = [
    { href: ROUTES.myAssetsOverview, label: t("mobileProfile.assetsOverview") },
    { href: ROUTES.myAssetsMetrics, label: t("mobileProfile.assetsMetrics") },
    { href: ROUTES.myAssetsPositionsStructure, label: t("mobileProfile.assetsPositions") },
    { href: ROUTES.myAssetsPayouts, label: t("nav.payouts") },
    { href: ROUTES.myAssetsOperations, label: t("mobileProfile.assetsActivity") },
  ];

  const copyUid = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleLogout = () => {
    void (async () => {
      await logout();
      onClose();
      router.push(ROUTES.login);
    })();
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t("mobileProfile.ariaLabel")}
    >
      <div className="flex h-dvh min-h-dvh flex-col overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#111111] text-base font-semibold text-white ring-1 ring-white/10"
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-medium text-white">{maskEmail(email)}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-zinc-500">
                <span className="truncate">
                  {t("mobileProfile.uid")}: {uid}
                </span>
                <button
                  type="button"
                  onClick={() => void copyUid()}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/8 hover:text-white"
                  aria-label={t("mobileProfile.copyUid")}
                >
                  <Copy className="size-3.5" strokeWidth={2} aria-hidden />
                </button>
                {copied ? <span className="text-[11px] text-[#B7F500]">{t("mobileProfile.copied")}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center text-white transition hover:text-white/80"
              aria-label={t("navigation.header.mobileMenuClose")}
            >
              <X className="size-[22px]" strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex size-10 items-center justify-center text-zinc-400 transition hover:bg-white/8 hover:text-white"
              aria-label={t("navigation.profile.logout.label")}
            >
              <LogOut className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        <Link
          href={DEPOSIT_HREF}
          onClick={onClose}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full border border-white/20 px-4 text-[15px] font-medium text-white transition hover:border-white/35 hover:bg-white/5 active:scale-[0.99]"
        >
          {t("mobileProfile.depositCta")}
        </Link>

        <nav className="mt-6 flex flex-col" aria-label={t("mobileProfile.menuAria")}>
          <button
            type="button"
            className={cn(menuRowClass, "flex items-center justify-between text-left")}
            aria-expanded={assetsOpen}
            onClick={() => setAssetsOpen((v) => !v)}
          >
            <span>{t("nav.assets")}</span>
            <ChevronDown
              className={cn("size-[18px] shrink-0 text-white/70 transition-transform duration-200", assetsOpen && "-rotate-180")}
              strokeWidth={2}
              aria-hidden
            />
          </button>
          {assetsOpen ? (
            <div className="pb-1">
              {assetLinks.map((item) => (
                <Link key={item.href} href={item.href} onClick={onClose} className={subMenuRowClass}>
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="my-3 h-px bg-white/10" aria-hidden />

          <p className="py-2 text-[17px] font-semibold text-white">{t("navigation.profile.overview.label")}</p>
          {profileLinks.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className={menuRowClass}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
