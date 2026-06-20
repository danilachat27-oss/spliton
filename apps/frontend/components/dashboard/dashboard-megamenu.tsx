"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BarChart3,
  BookOpen,
  Calculator,
  CircleHelp,
  ChevronRight,
  Compass,
  FileText,
  GitCompare,
  Handshake,
  History,
  LayoutDashboard,
  LayoutGrid,
  MessageSquarePlus,
  Mic2,
  Newspaper,
  Percent,
  PieChart,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Settings,
  Lock,
  LogOut,
  UserRound,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from "@/lib/lucide";
import { useEffect, useState, type ReactNode } from "react";

import {
  CabinetMegamenuPagePreview,
  isCabinetMegamenuPreviewHref,
} from "@/components/dashboard/cabinet-megamenu-page-preview";
import { MegamenuImagePreview } from "@/components/dashboard/megamenu-image-preview";
import {
  ProfileMegamenuPagePreview,
  isProfileMegamenuPreviewHref,
} from "@/components/dashboard/profile-megamenu-page-preview";
import { ServicesMegamenuPagePreview } from "@/components/dashboard/services-megamenu-page-preview";
import type {
  DashboardNavBadge,
  DashboardNavItem,
  DashboardNavSubItem,
} from "@/components/dashboard/dashboard-nav";
import {
  SupportMegamenuPagePreview,
  isSupportMegamenuPreviewHref,
} from "@/components/dashboard/support-megamenu-page-preview";
import { SUPPORT_QUICK_ACTIONS } from "@/constants/support-hub-config";
import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { useLocalizedProfileMenuItems, useLocalizedSupportMenuItems } from "@/hooks/use-shell-i18n";
import { cn } from "@/lib/utils";

export const DASHBOARD_MEGAMENU_PANEL_ID = "dashboard-header-megamenu";

export const SPLIT_MEGAMENU_IDS = ["catalog", "holdings", "payouts", "misc"] as const;

export function isSplitMegamenuId(id: string): boolean {
  return (SPLIT_MEGAMENU_IDS as readonly string[]).includes(id);
}

/** Волны внутри каждой карточки (нижняя зона) */
function CardInnerWaves({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none text-white/[0.05]", className)}
      viewBox="0 0 120 48"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <path stroke="currentColor" strokeWidth="0.6" d="M0 36 C20 28 40 44 60 32 S100 40 120 28" />
      <path stroke="currentColor" strokeWidth="0.5" opacity="0.7" d="M0 42 C24 34 48 48 72 36 S108 44 120 38" />
    </svg>
  );
}

function MegamenuLineArt({ variant, className }: { variant: number; className?: string }) {
  const v = variant % 5;
  return (
    <svg
      className={cn(
        "pointer-events-none text-white/[0.07] transition-opacity duration-300 group-hover:text-white/[0.12]",
        className
      )}
      viewBox="0 0 100 72"
      fill="none"
      aria-hidden
    >
      {v === 0 ? (
        <>
          {[...Array(14)].map((_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const x2 = 50 + Math.cos(a) * 38;
            const y2 = 36 + Math.sin(a) * 28;
            return (
              <line key={i} x1="50" y1="36" x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.45" opacity={0.35 + (i % 3) * 0.08} />
            );
          })}
          <circle cx="50" cy="36" r="4" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        </>
      ) : null}
      {v === 1 ? (
        <>
          {[8, 16, 24, 32, 40].map((r, i) => (
            <ellipse
              key={r}
              cx="50"
              cy="38"
              rx={r * 0.9}
              ry={r * 0.55}
              stroke="currentColor"
              strokeWidth="0.4"
              opacity={0.2 + i * 0.12}
              transform={`rotate(${i * 3} 50 38)`}
            />
          ))}
        </>
      ) : null}
      {v === 2 ? (
        <>
          <path
            d="M4 48 Q22 22 50 36 T96 30"
            stroke="currentColor"
            strokeWidth="0.55"
            strokeDasharray="2 4"
            opacity="0.55"
          />
          <path d="M4 52 L4 48 Q50 34 96 42 L96 52 Z" fill="currentColor" opacity="0.06" />
        </>
      ) : null}
      {v === 3 ? (
        <>
          {[7, 14, 21, 28, 35].map((r, i) => (
            <circle
              key={r}
              cx="50"
              cy="40"
              r={r}
              stroke="currentColor"
              strokeWidth="0.35"
              fill="none"
              opacity={0.12 + i * 0.07}
              transform={`rotate(${i * 11} 50 40)`}
            />
          ))}
        </>
      ) : null}
      {v === 4 ? (
        <>
          <path d="M20 52 L35 38 L50 48 L65 34 L80 46" stroke="currentColor" strokeWidth="0.45" opacity="0.45" />
          <path d="M24 56 L40 44 L52 52 L68 40 L76 50" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
          <circle cx="50" cy="42" r="3" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
        </>
      ) : null}
    </svg>
  );
}

function SubnavBadge({
  badge,
  variant = "dark",
}: {
  badge: DashboardNavBadge;
  variant?: "dark" | "light";
}) {
  const { t } = useI18n();
  const styles: Record<DashboardNavBadge, string> =
    variant === "light"
      ? {
          new: "border border-zinc-200 bg-zinc-100 text-[10px] font-bold uppercase tracking-wide text-zinc-800",
          free: "border border-zinc-200 bg-white text-[10px] font-semibold uppercase tracking-wide text-zinc-700",
          hot: "border border-amber-300/60 bg-amber-50 text-[10px] font-semibold uppercase tracking-wide text-amber-800",
        }
      : {
          new: "border border-white/18 bg-white/[0.1] text-[10px] font-bold uppercase tracking-wide text-zinc-100",
          free: "border border-white/10 bg-zinc-900 text-[10px] font-semibold uppercase tracking-wide text-white/85",
          hot: "border border-amber-400/22 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-wide text-amber-100/95",
        };
  const text: Record<DashboardNavBadge, string> = {
    new: t("navigation.badge.new"),
    free: t("navigation.badge.free"),
    hot: t("navigation.badge.hot"),
  };
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5", styles[badge])} aria-hidden>
      {text[badge]}
    </span>
  );
}

function SubItemIcon({ sub, className }: { sub: DashboardNavSubItem; className?: string }) {
  const hint = (sub.iconHint ?? sub.label).slice(0, 2).toUpperCase();

  if (sub.iconSrc) {
    return (
      <div
        className={cn(
          "relative z-[2] h-[96px] w-[92%] overflow-hidden rounded-lg bg-black/40",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- произвольные пути из public */}
        <img
          src={sub.iconSrc}
          alt=""
          className="h-full w-full object-cover object-center brightness-125 contrast-125 saturate-110 transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative z-[2] flex size-11 items-center justify-center rounded-xl border border-dashed border-white/18 bg-white/[0.03] text-[11px] font-bold tracking-tight text-white/30 transition-all duration-300 group-hover:border-white/28 group-hover:bg-white/[0.06] group-hover:text-white/50",
        className
      )}
      aria-hidden
    >
      {hint}
    </div>
  );
}

const cardShell =
  "group relative flex h-full min-h-[220px] w-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-black transition-all duration-300 sm:min-h-[236px]";

const cardHover =
  "hover:z-[2] hover:scale-[1.01] hover:border-white/16 hover:shadow-[0_16px_48px_-18px_rgba(0,0,0,0.85)]";

function MegamenuFeaturedGraphic() {
  return (
    <div className="relative mx-auto flex min-h-[84px] flex-1 items-center justify-center py-2" aria-hidden>
      <div className="absolute inset-x-1 bottom-1 opacity-35">
        <CardInnerWaves className="size-full" />
      </div>
      <div className="relative flex size-[72px] items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-2 rounded-full border border-white/[0.06]" />
        <div className="absolute inset-[14px] rounded-full border border-dashed border-white/10" />
        <div className="relative z-[1] flex size-8 items-center justify-center rounded-full bg-white/[0.06] text-[9px] font-bold text-white/90">
          RS
        </div>
        <span className="absolute -right-0.5 top-2 size-1.5 rounded-full bg-white/35" />
        <span className="absolute bottom-4 -left-0.5 size-1 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function MegamenuIntroCard({
  title,
  href,
  onNavigate,
  imageSrc,
}: {
  title: string;
  href: string;
  onNavigate: () => void;
  imageSrc?: string;
}) {
  return (
    <Link href={href} onClick={onNavigate} className={cn(cardShell, cardHover, "p-3 sm:p-3.5")}>
      {imageSrc ? (
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover object-center brightness-75"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 opacity-[0.25]">
        <CardInnerWaves className="absolute inset-x-0 bottom-0 h-24 w-full" />
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <h2 className="text-sm font-bold leading-tight tracking-tight text-white sm:text-[15px]">{title}</h2>
        {!imageSrc ? (
          <MegamenuFeaturedGraphic />
        ) : null}
      </div>
    </Link>
  );
}

function MegamenuLinkCard({
  sub,
  index,
  onNavigate,
}: {
  sub: DashboardNavSubItem;
  index: number;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const danger = Boolean(sub.danger);
  const handleDangerClick = async () => {
    if (!danger) {
      return;
    }
    await logout();
    onNavigate();
    router.push(ROUTES.login);
  };

  if (danger) {
    return (
      <div
        className="animate-dashboard-megamenu-card-in h-full w-full"
        style={{ animationDelay: `${45 + index * 42}ms` }}
      >
        <button
          type="button"
          onClick={handleDangerClick}
          className={cn(
            cardShell,
            "w-full text-left border-fuchsia-500/15 p-3 sm:p-3.5 hover:z-[2] hover:scale-[1.01] hover:border-fuchsia-400/35 hover:shadow-[0_16px_48px_-18px_rgba(80,0,60,0.5)]",
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-25">
            <CardInnerWaves className="size-full" />
          </div>
          <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-[13px] font-bold leading-snug text-fuchsia-200/95 sm:text-sm">
                {sub.label}
              </h3>
              {sub.badge ? <SubnavBadge badge={sub.badge} /> : null}
            </div>
            <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-fuchsia-200/50 sm:text-xs">
              {sub.description}
            </p>
            <div className="relative mt-2 flex min-h-[88px] flex-1 flex-col justify-end overflow-hidden rounded-lg bg-fuchsia-950/20 py-3">
              <MegamenuLineArt variant={index} className="absolute inset-0 size-full opacity-75" />
              <div className="relative flex flex-1 items-center justify-center py-3">
                <SubItemIcon sub={sub} />
              </div>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      className="animate-dashboard-megamenu-card-in h-full w-full"
      style={{ animationDelay: `${45 + index * 42}ms` }}
    >
      <Link
        href={sub.href}
        onClick={onNavigate}
        className={cn(
          cardShell,
          cardHover,
          "p-3 sm:p-3.5",
        )}
      >
        {sub.iconSrc ? (
          <div className="pointer-events-none absolute inset-0">
            <Image
              src={sub.iconSrc}
              alt=""
              fill
              className="object-cover object-center brightness-[0.85] saturate-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/75" />
          </div>
        ) : null}
        {!sub.iconSrc ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-25">
            <CardInnerWaves className="size-full" />
          </div>
        ) : null}

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "min-w-0 text-[13px] font-bold leading-snug sm:text-sm",
                "text-white",
              )}
            >
              {sub.label}
            </h3>
            {sub.badge ? <SubnavBadge badge={sub.badge} /> : null}
          </div>
          <p
            className={cn(
              "mt-2 line-clamp-3 text-[11px] leading-relaxed sm:text-xs",
              sub.iconSrc ? "text-neutral-400" : "text-neutral-500",
            )}
          >
            {sub.description}
          </p>

          {!sub.iconSrc ? (
            <div
              className={cn(
                "relative mt-2 flex min-h-[88px] flex-1 flex-col justify-end overflow-hidden rounded-lg bg-black/25 py-3",
              )}
            >
              <MegamenuLineArt variant={index} className="absolute inset-0 size-full opacity-75" />
              <div className="relative flex flex-1 items-center justify-center py-3">
                <SubItemIcon sub={sub} />
              </div>
            </div>
          ) : null}
        </div>
      </Link>
    </div>
  );
}

export const DASHBOARD_PROFILE_MEGAMENU_ID = "dashboard-profile-megamenu";
export const DASHBOARD_SUPPORT_MEGAMENU_ID = "dashboard-support-megamenu";

/** Пункты меню профиля — те же карточки, что и в mega-menu разделов. */
export const PROFILE_MEGAMENU_ITEMS: DashboardNavSubItem[] = [
  {
    label: "",
    description: "",
    href: profileDashboardHref("overview"),
    iconHint: "PR",
  },
  {
    label: "",
    description: "",
    href: profileDashboardHref("verification"),
    iconHint: "KYC",
  },
  {
    label: "",
    description: "",
    href: profileDashboardHref("security"),
    iconHint: "2F",
  },
  {
    label: "",
    description: "",
    href: profileDashboardHref("settings"),
    iconHint: "NS",
  },
  {
    label: "",
    description: "",
    href: ROUTES.login,
    iconHint: "OUT",
    danger: true,
  },
];

const SERVICE_MENU_ICONS: Record<string, LucideIcon> = {
  [ROUTES.calculator]: Calculator,
  [ROUTES.fees]: Percent,
  [ROUTES.systemStatus]: Activity,
  [ROUTES.news]: Newspaper,
  [ROUTES.referralProgram]: UserPlus,
  [ROUTES.partnerProgram]: Handshake,
  [ROUTES.dashboardArtist]: Mic2,
  [ROUTES.dashboardDisputes]: Scale,
  [ROUTES.dashboardStatements]: FileText,
  [ROUTES.trust]: ShieldCheck,
};

const CATALOG_MENU_ICONS: Record<string, LucideIcon> = {
  [ROUTES.dashboardCatalog]: BookOpen,
  [ROUTES.analyticsReleases]: BarChart3,
  [ROUTES.guideSelection]: Compass,
  [ROUTES.catalogReleaseParameters]: SlidersHorizontal,
  [ROUTES.catalogMarketOverview]: LayoutGrid,
};

const HOLDINGS_MENU_ICONS: Record<string, LucideIcon> = {
  [ROUTES.myAssetsOverview]: LayoutDashboard,
  [ROUTES.myAssetsMetrics]: BarChart3,
  [ROUTES.myAssetsOperations]: Activity,
  [ROUTES.myAssetsPositionsStructure]: LayoutGrid,
};

const PAYOUTS_MENU_ICONS: Record<string, LucideIcon> = {
  [ROUTES.dashboardPayouts]: PieChart,
  [ROUTES.dashboardPayoutsComparison]: GitCompare,
  [ROUTES.dashboardPayoutsHistory]: History,
  [`${ROUTES.dashboardPayouts}/deposit`]: ArrowDownToLine,
  [`${ROUTES.dashboardPayouts}/withdraw`]: ArrowUpFromLine,
};

const PROFILE_MENU_ICONS: Record<string, LucideIcon> = {
  [profileDashboardHref("overview")]: UserRound,
  [profileDashboardHref("verification")]: ShieldCheck,
  [profileDashboardHref("security")]: Lock,
  [profileDashboardHref("settings")]: Settings,
  [ROUTES.login]: LogOut,
};

const SUPPORT_MENU_ICONS: Record<string, LucideIcon> = {
  [ROUTES.support]: CircleHelp,
  [ROUTES.dashboardSupport]: MessageSquarePlus,
  [ROUTES.systemStatus]: Activity,
  [`${ROUTES.dashboardProfile}?tab=security`]: ShieldCheck,
  ...Object.fromEntries(SUPPORT_QUICK_ACTIONS.map((action) => [action.href, action.icon])),
};

export const SUPPORT_MEGAMENU_ITEMS: DashboardNavSubItem[] = [
  {
    label: "",
    description: "",
    href: ROUTES.support,
    iconHint: "HC",
  },
  {
    label: "",
    description: "",
    href: ROUTES.dashboardSupport,
    iconHint: "TK",
  },
  {
    label: "",
    description: "",
    href: ROUTES.systemStatus,
    iconHint: "ST",
  },
  {
    label: "",
    description: "",
    href: `${ROUTES.dashboardProfile}?tab=security`,
    iconHint: "SC",
  },
];

export const MEGAMENU_ICON_MAPS: Record<string, Record<string, LucideIcon>> = {
  misc: SERVICE_MENU_ICONS,
  catalog: CATALOG_MENU_ICONS,
  holdings: HOLDINGS_MENU_ICONS,
  payouts: PAYOUTS_MENU_ICONS,
};

function renderSplitMegamenuPreview(openItemId: string, sub: DashboardNavSubItem): ReactNode {
  if (openItemId === "misc") {
    return <ServicesMegamenuPagePreview href={sub.href} label={sub.label} />;
  }
  if (isCabinetMegamenuPreviewHref(sub.href)) {
    return <CabinetMegamenuPagePreview href={sub.href} label={sub.label} />;
  }
  return <MegamenuImagePreview sub={sub} />;
}

function renderProfileMegamenuPreview(sub: DashboardNavSubItem): ReactNode {
  if (isProfileMegamenuPreviewHref(sub.href)) {
    return <ProfileMegamenuPagePreview href={sub.href} label={sub.label} />;
  }
  return null;
}

function renderSupportMegamenuPreview(sub: DashboardNavSubItem): ReactNode {
  if (isSupportMegamenuPreviewHref(sub.href)) {
    return <SupportMegamenuPagePreview href={sub.href} label={sub.label} />;
  }
  return null;
}

function SplitMegamenuNavRow({
  sub,
  index,
  active,
  onActivate,
  onNavigate,
  Icon,
  dangerAction,
}: {
  sub: DashboardNavSubItem;
  index: number;
  active: boolean;
  onActivate: (index: number) => void;
  onNavigate: () => void;
  Icon: LucideIcon;
  dangerAction?: () => void | Promise<void>;
}) {
  const danger = Boolean(sub.danger);
  const shell = cn(
    "group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors sm:px-3.5 sm:py-3",
    active ? "bg-zinc-100" : "hover:bg-zinc-50",
    danger && active && "bg-fuchsia-50 hover:bg-fuchsia-50",
    danger && !active && "hover:bg-fuchsia-50/70",
  );
  const iconShell = cn(
    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
    danger
      ? active
        ? "border-fuchsia-200 bg-white text-fuchsia-700"
        : "border-transparent bg-fuchsia-50 text-fuchsia-600 group-hover:border-fuchsia-200 group-hover:bg-white"
      : active
        ? "border-zinc-200 bg-white text-zinc-900"
        : "border-transparent bg-zinc-100 text-zinc-700 group-hover:border-zinc-200 group-hover:bg-white",
  );
  const labelClass = cn(
    "text-[14px] font-semibold leading-snug",
    danger ? "text-fuchsia-900" : "text-zinc-900",
  );
  const inner = (
    <>
      <span className={iconShell}>
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={labelClass}>{sub.label}</span>
          {sub.badge ? <SubnavBadge badge={sub.badge} variant="light" /> : null}
        </span>
        {sub.description ? (
          <p
            className={cn(
              "mt-0.5 line-clamp-2 text-[12px] leading-snug",
              danger ? "text-fuchsia-700/75" : "text-zinc-500",
            )}
          >
            {sub.description}
          </p>
        ) : null}
      </span>
      <ChevronRight
        className={cn(
          "mt-1 size-4 shrink-0 text-zinc-300 transition-colors",
          active && (danger ? "text-fuchsia-400" : "text-zinc-500"),
        )}
        strokeWidth={2}
        aria-hidden
      />
    </>
  );

  if (danger && dangerAction) {
    return (
      <button
        type="button"
        onClick={dangerAction}
        onMouseEnter={() => onActivate(index)}
        onFocus={() => onActivate(index)}
        className={shell}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={sub.href}
      onClick={onNavigate}
      onMouseEnter={() => onActivate(index)}
      onFocus={() => onActivate(index)}
      className={shell}
    >
      {inner}
    </Link>
  );
}

function SplitMegamenuPreviewPanel({
  sub,
  onNavigate,
  preview,
  dangerAction,
}: {
  sub: DashboardNavSubItem;
  onNavigate: () => void;
  preview: ReactNode;
  dangerAction?: () => void | Promise<void>;
}) {
  const { t } = useI18n();
  const danger = Boolean(sub.danger);

  if (danger && dangerAction) {
    return (
      <div className="flex h-full min-h-[340px] flex-col p-4 sm:p-5">
        <div className="flex-1" />
        <button
          type="button"
          onClick={dangerAction}
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg bg-fuchsia-700 px-4 text-sm font-semibold text-white transition hover:bg-fuchsia-600"
        >
          {sub.label}
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[340px] flex-col p-4 sm:p-5">
      {preview}
      <div className="flex-1" />

      <Link
        href={sub.href}
        onClick={onNavigate}
        className="mt-4 inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        {t("navigation.megamenu.servicesGo")}
        <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}

/** Двухколоночный flyout (master-detail) — как «Сервисы». */
export function SplitMegamenuFlyout({
  openItem,
  onNavigate,
  className,
}: {
  openItem: DashboardNavItem;
  onNavigate: () => void;
  className?: string;
}) {
  const children = openItem.children ?? [];
  const isLongList = children.length > 6;
  const iconMap = MEGAMENU_ICON_MAPS[openItem.id] ?? {};
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [openItem.id]);

  const active = children[activeIdx] ?? children[0];
  if (!active) return null;

  return (
    <div
      id={DASHBOARD_MEGAMENU_PANEL_ID}
      role="region"
      aria-labelledby={`nav-trigger-${openItem.id}`}
      className={cn("pointer-events-auto", className)}
    >
      <div
        key={openItem.id}
        className="animate-dashboard-megamenu-in flex w-[min(calc(100vw-1.5rem),760px)] overflow-hidden rounded-2xl bg-white shadow-[0_24px_56px_-16px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.06]"
      >
        <div className="flex min-h-[420px] max-h-[min(72vh,620px)] w-[min(56%,360px)] shrink-0 flex-col border-r border-zinc-100">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">{openItem.label}</p>
          </div>
          <ul
            className={cn(
              "min-h-0 flex-1 gap-1.5 overflow-y-auto p-2 [scrollbar-color:rgb(212_212_216)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar]:w-1.5",
              isLongList ? "flex flex-col" : "grid auto-rows-min",
            )}
          >
            {children.map((sub, i) => {
              const Icon = iconMap[sub.href] ?? BookOpen;
              return (
                <li key={sub.href} className="shrink-0">
                  <SplitMegamenuNavRow
                    sub={sub}
                    index={i}
                    active={activeIdx === i}
                    onActivate={setActiveIdx}
                    onNavigate={onNavigate}
                    Icon={Icon}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden min-w-0 flex-1 bg-zinc-50/50 sm:block">
          <SplitMegamenuPreviewPanel
            key={active.href}
            sub={active}
            onNavigate={onNavigate}
            preview={renderSplitMegamenuPreview(openItem.id, active)}
          />
        </div>
      </div>
    </div>
  );
}

/** @deprecated Используйте {@link SplitMegamenuFlyout}. */
export function ServicesSplitMegamenuFlyout({
  openItem,
  onNavigate,
  className,
}: {
  openItem: DashboardNavItem;
  onNavigate: () => void;
  className?: string;
}) {
  return <SplitMegamenuFlyout openItem={openItem} onNavigate={onNavigate} className={className} />;
}

export function ProfileMegamenuFlyout({
  onNavigate,
  className,
}: {
  onNavigate: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { logout } = useAuth();
  const profileItems = useLocalizedProfileMenuItems();
  const isLongList = profileItems.length > 6;
  const [activeIdx, setActiveIdx] = useState(0);

  const handleLogout = async () => {
    await logout();
    onNavigate();
    router.push(ROUTES.login);
  };

  const active = profileItems[activeIdx] ?? profileItems[0];
  if (!active) return null;

  return (
    <div
      id={DASHBOARD_PROFILE_MEGAMENU_ID}
      role="region"
      aria-label={t("navigation.megamenu.profileAria")}
      className={cn("pointer-events-auto", className)}
    >
      <div className="animate-dashboard-megamenu-in flex w-[min(calc(100vw-1.5rem),760px)] overflow-hidden rounded-2xl bg-white shadow-[0_24px_56px_-16px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.06]">
        <div className="flex min-h-[420px] max-h-[min(72vh,620px)] w-[min(56%,360px)] shrink-0 flex-col border-r border-zinc-100">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">{t("navigation.header.profile")}</p>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-zinc-500">
              {t("navigation.profile.overview.desc")}
            </p>
          </div>
          <ul
            className={cn(
              "min-h-0 flex-1 gap-1.5 overflow-y-auto p-2 [scrollbar-color:rgb(212_212_216)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar]:w-1.5",
              isLongList ? "flex flex-col" : "grid auto-rows-min",
            )}
          >
            {profileItems.map((sub, i) => {
              const Icon = PROFILE_MENU_ICONS[sub.href] ?? UserRound;
              return (
                <li key={sub.href} className="shrink-0">
                  <SplitMegamenuNavRow
                    sub={sub}
                    index={i}
                    active={activeIdx === i}
                    onActivate={setActiveIdx}
                    onNavigate={onNavigate}
                    Icon={Icon}
                    dangerAction={sub.danger ? handleLogout : undefined}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden min-w-0 flex-1 bg-zinc-50/50 sm:block">
          <SplitMegamenuPreviewPanel
            key={active.href}
            sub={active}
            onNavigate={onNavigate}
            preview={renderProfileMegamenuPreview(active)}
            dangerAction={active.danger ? handleLogout : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export function SupportMegamenuFlyout({
  onNavigate,
  className,
}: {
  onNavigate: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const supportItems = useLocalizedSupportMenuItems();
  const isLongList = supportItems.length > 6;
  const [activeIdx, setActiveIdx] = useState(0);

  const active = supportItems[activeIdx] ?? supportItems[0];
  if (!active) return null;

  return (
    <div
      id={DASHBOARD_SUPPORT_MEGAMENU_ID}
      role="region"
      aria-label={t("navigation.header.help")}
      className={cn("pointer-events-auto", className)}
    >
      <div className="animate-dashboard-megamenu-in flex w-[min(calc(100vw-1.5rem),760px)] overflow-hidden rounded-2xl bg-white shadow-[0_24px_56px_-16px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.06]">
        <div className="flex min-h-[420px] max-h-[min(72vh,620px)] w-[min(56%,360px)] shrink-0 flex-col border-r border-zinc-100">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">{t("support.hero.title")}</p>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-zinc-500">{t("support.hero.subtitle")}</p>
          </div>
          <ul
            className={cn(
              "min-h-0 flex-1 gap-1.5 overflow-y-auto p-2 [scrollbar-color:rgb(212_212_216)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar]:w-1.5",
              isLongList ? "flex flex-col" : "grid auto-rows-min",
            )}
          >
            {supportItems.map((sub, i) => {
              const Icon = SUPPORT_MENU_ICONS[sub.href] ?? CircleHelp;
              return (
                <li key={sub.href} className="shrink-0">
                  <SplitMegamenuNavRow
                    sub={sub}
                    index={i}
                    active={activeIdx === i}
                    onActivate={setActiveIdx}
                    onNavigate={onNavigate}
                    Icon={Icon}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden min-w-0 flex-1 bg-zinc-50/50 sm:block">
          <SplitMegamenuPreviewPanel
            key={active.href}
            sub={active}
            onNavigate={onNavigate}
            preview={renderSupportMegamenuPreview(active)}
          />
        </div>
      </div>
    </div>
  );
}

/** @deprecated Используйте {@link ProfileMegamenuFlyout}. */
export function DashboardProfileMegamenuPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <ProfileMegamenuFlyout
      onNavigate={onNavigate}
      className="border-t border-white/[0.05] bg-black/90 backdrop-blur-md supports-backdrop-filter:bg-black/80"
    />
  );
}

function MobileMegamenuScroll({
  openItem,
  onNavigate,
}: {
  openItem: DashboardNavItem;
  onNavigate: () => void;
}) {
  const { t } = useI18n();
  const showIntro = openItem.id !== "holdings";
  const introTitle =
    openItem.id === "catalog"
      ? t("navigation.megamenu.catalogCta")
      : openItem.id === "holdings"
        ? t("navigation.megamenu.holdingsCta")
        : openItem.label;

  return (
    <div className="w-full px-3 py-2 sm:px-4 sm:py-2">
      <div
        key={openItem.id}
        className="animate-dashboard-megamenu-in relative z-[1] flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {showIntro ? (
          <div className="w-[min(260px,85vw)] flex-none snap-start">
            <MegamenuIntroCard
              title={introTitle}
              href={openItem.href}
              onNavigate={onNavigate}
              imageSrc={
                openItem.id === "catalog"
                  ? "/images/catalog/1.png"
                  : openItem.id === "payouts"
                    ? "/images/payouts-menu/6.png"
                    : undefined
              }
            />
          </div>
        ) : null}
        {openItem.children?.map((sub, i) => (
          <div key={sub.label} className="w-[min(240px,78vw)] flex-none snap-start">
            <MegamenuLinkCard sub={sub} index={i} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardMegamenuPanel({
  openItem,
  onNavigate,
}: {
  openItem: DashboardNavItem | undefined;
  onNavigate: () => void;
}) {
  const { t } = useI18n();

  if (!openItem?.children?.length) return null;

  /** Split flyout на desktop — полноширинная панель только на mobile (кроме «Сервисы»). */
  if (isSplitMegamenuId(openItem.id)) {
    if (openItem.id === "misc") return null;

    return (
      <div
        id={DASHBOARD_MEGAMENU_PANEL_ID}
        role="region"
        aria-labelledby={`nav-trigger-${openItem.id}`}
        className="border-t border-white/[0.05] bg-black/90 backdrop-blur-md supports-backdrop-filter:bg-black/80 lg:hidden"
      >
        <MobileMegamenuScroll openItem={openItem} onNavigate={onNavigate} />
      </div>
    );
  }

  const showIntro = openItem.id !== "holdings";
  const introTitle =
    openItem.id === "catalog"
      ? t("navigation.megamenu.catalogCta")
      : openItem.id === "holdings"
        ? t("navigation.megamenu.holdingsCta")
        : openItem.label;

  const count = openItem.children.length;
  /** Одна строка, равные колонки — без отдельного большого «второго» контейнера */
  const gridCols = `repeat(${showIntro ? 1 + count : count}, minmax(0, 1fr))`;

  return (
    <div
      id={DASHBOARD_MEGAMENU_PANEL_ID}
      role="region"
      aria-labelledby={`nav-trigger-${openItem.id}`}
      className="border-t border-white/[0.05] bg-black/90 backdrop-blur-md supports-backdrop-filter:bg-black/80"
    >
      <div className="w-full px-3 py-2 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5">
        <div
          key={openItem.id}
          className="animate-dashboard-megamenu-in relative z-[1] hidden gap-2 lg:grid"
          style={{ gridTemplateColumns: gridCols }}
        >
          {showIntro ? (
            <MegamenuIntroCard
              title={introTitle}
              href={openItem.href}
              onNavigate={onNavigate}
              imageSrc={
                openItem.id === "catalog"
                  ? "/images/catalog/1.png"
                  : openItem.id === "payouts"
                    ? "/images/payouts-menu/6.png"
                    : undefined
              }
            />
          ) : null}
          {openItem.children.map((sub, i) => (
            <MegamenuLinkCard key={sub.label} sub={sub} index={i} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="relative z-[1] flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {showIntro ? (
            <div className="w-[min(260px,85vw)] flex-none snap-start">
              <MegamenuIntroCard
                title={introTitle}
                href={openItem.href}
                onNavigate={onNavigate}
                imageSrc={
                  openItem.id === "catalog"
                    ? "/images/catalog/1.png"
                    : openItem.id === "payouts"
                      ? "/images/payouts-menu/6.png"
                      : undefined
                }
              />
            </div>
          ) : null}
          {openItem.children.map((sub, i) => (
            <div key={sub.label} className="w-[min(240px,78vw)] flex-none snap-start">
              <MegamenuLinkCard sub={sub} index={i} onNavigate={onNavigate} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
