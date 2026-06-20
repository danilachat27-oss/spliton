"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Menu,
  User,
  X,
} from "@/lib/lucide";

import { DashboardMobileMenu } from "@/components/dashboard/dashboard-mobile-menu";
import { useMobileTabBarShell } from "@/components/layout/mobile-tab-bar-shell";
import { useDashboardHeaderOverlay } from "@/components/layout/dashboard-header-overlay-context";
import {
  DASHBOARD_MEGAMENU_PANEL_ID,
  DASHBOARD_PROFILE_MEGAMENU_ID,
  DASHBOARD_SUPPORT_MEGAMENU_ID,
  DashboardMegamenuPanel,
  SplitMegamenuFlyout,
  ProfileMegamenuFlyout,
  SupportMegamenuFlyout,
  isSplitMegamenuId,
} from "@/components/dashboard/dashboard-megamenu";
import {
  DashboardHeaderSearchInline,
} from "@/components/dashboard/dashboard-header-search";
import {
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-nav";
import { SplitonLogo } from "@/components/dashboard/revshare-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DASHBOARD_MISC_PATHS, ROUTES } from "@/constants/routes";
import { useHeaderWalletBalance } from "@/hooks/use-header-wallet-balance";
import { useLocalizedNavItems } from "@/hooks/use-localized-nav";
import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

const DEPOSIT_HREF = `${ROUTES.dashboardPayouts}/deposit`;
const PAYOUTS_HISTORY_HREF = ROUTES.dashboardPayoutsHistory;

function HeaderDivider({ className }: { className?: string }) {
  return (
    <span
      className={cn("hidden h-5 w-px shrink-0 bg-white/12 lg:block", className)}
      aria-hidden
    />
  );
}

const headerIconShellClass =
  "flex size-9 shrink-0 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/8 hover:text-white";

function navItemActive(item: DashboardNavItem, pathname: string, hash: string) {
  if (item.href === ROUTES.dashboard) {
    return pathname === ROUTES.dashboard && (!hash || hash === "");
  }
  if (item.href === ROUTES.myAssetsOverview) {
    return pathname.startsWith("/assets/overview") ||
      pathname.startsWith("/assets/sell/") ||
      pathname.startsWith("/assets/metrics") ||
      pathname.startsWith("/assets/positions") ||
      pathname.startsWith("/assets/activity") ||
      pathname.startsWith("/dashboard/overview") ||
      pathname.startsWith("/dashboard/metrics") ||
      pathname.startsWith("/dashboard/positions") ||
      pathname.startsWith("/dashboard/activity");
  }
  if (item.href === ROUTES.dashboardPayouts) {
    return pathname === ROUTES.dashboardPayouts || pathname.startsWith(`${ROUTES.dashboardPayouts}/`) || pathname.startsWith("/dashboard/payouts");
  }
  if (item.href === ROUTES.dashboardCatalog || item.href.startsWith(`${ROUTES.dashboardCatalog}?`)) {
    return (
      pathname === ROUTES.dashboardCatalog ||
      pathname.startsWith(`${ROUTES.dashboardCatalog}/`) ||
      pathname === ROUTES.analyticsReleases ||
      pathname.startsWith(`${ROUTES.analyticsReleases}/`) ||
      pathname === ROUTES.guideSelection ||
      pathname.startsWith(`${ROUTES.guideSelection}/`)
    );
  }
  if (item.href === ROUTES.dashboardSecondaryMarket) {
    return (
      pathname === ROUTES.dashboardSecondaryMarket ||
      pathname.startsWith(`${ROUTES.dashboardSecondaryMarket}/`)
    );
  }
  if (item.id === "misc") {
    const p = pathname.replace(/\/$/, "") || "/";
    return DASHBOARD_MISC_PATHS.includes(p);
  }
  const frag = item.href.includes("#") ? `#${item.href.split("#")[1]}` : "";
  return pathname === ROUTES.dashboard && frag !== "" && hash === frag;
}

function NavTrigger({
  item,
  pathname,
  hash,
  expandedKey,
  onToggle,
  onHoverOpen,
  onNavigate,
  isDesktop,
  size = "desktop",
  menuAriaLabel,
}: {
  item: DashboardNavItem;
  pathname: string;
  hash: string;
  expandedKey: string | null;
  onToggle: (id: string) => void;
  onHoverOpen: (id: string) => void;
  /** Закрыть мегаменю при переходе по ссылке пункта */
  onNavigate: () => void;
  isDesktop: boolean;
  size?: "desktop" | "mobile";
  menuAriaLabel: string;
}) {
  const isOpen = expandedKey === item.id;
  const isActive = navItemActive(item, pathname, hash) || isOpen;
  const hasMenu = Boolean(item.children?.length);

  const shellDesktop =
    "flex shrink-0 items-center rounded-md text-[11px] font-semibold uppercase tracking-[0.1em] leading-[1.15] transition-colors lg:px-0";
  const shellMobile = "flex w-full min-w-0 items-center rounded-md text-[11px] font-medium";
  const shell = size === "desktop" ? shellDesktop : shellMobile;
  const activeShell = isActive
    ? "bg-white/12 text-white"
    : "text-white/80 hover:bg-white/8 hover:text-white";
  const linkPad =
    size === "desktop"
      ? "flex items-center rounded-l-md px-2.5 py-2 lg:pl-3 lg:pr-1.5"
      : "flex min-w-0 flex-1 items-center justify-center rounded-l-md px-2 py-1.5 pr-1";
  const btnPad =
    size === "desktop" ? "flex items-center justify-center rounded-r-md py-2 pr-2 pl-0.5" : "flex items-center rounded-r-md py-1.5 pr-2 pl-0.5";

  if (!hasMenu) {
    return (
      <Link
        href={item.href}
        className={cn(
          size === "desktop"
            ? "flex shrink-0 items-center gap-1 rounded-md px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] leading-[1.15] text-white/80 transition-colors lg:px-3"
            : "flex min-w-0 w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-white/80",
          isActive ? "bg-white/12 text-white" : "hover:bg-white/8 hover:text-white",
        )}
      >
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => {
        if (isDesktop) onHoverOpen(item.id);
      }}
    >
      <div className={cn(shell, activeShell)}>
        <Link href={item.href} onClick={onNavigate} className={cn(linkPad, "min-w-0 hover:text-zinc-100")}>
          <span className="truncate">{item.label}</span>
        </Link>
        <button
          type="button"
          id={`nav-trigger-${item.id}`}
          aria-expanded={isOpen}
          aria-controls={DASHBOARD_MEGAMENU_PANEL_ID}
          aria-label={menuAriaLabel}
          onClick={(e) => {
            e.preventDefault();
            onToggle(item.id);
          }}
          className={cn(btnPad, "text-inherit hover:text-zinc-100")}
        >
          <ChevronDown
            className={cn(
              size === "desktop" ? "size-3.5" : "size-3",
              "opacity-70 transition-transform duration-200",
              isOpen && "-rotate-180",
            )}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </div>

      {isSplitMegamenuId(item.id) && isOpen && isDesktop ? (
        <SplitMegamenuFlyout
          openItem={item}
          onNavigate={onNavigate}
          className={cn(
            "absolute top-full z-[120] hidden pt-2 lg:block",
            item.id === "misc" ? "right-0" : "left-0",
          )}
        />
      ) : null}
    </div>
  );
}

type DashboardHeaderProps = {
  /**
   * When false, the bar participates in normal document scroll (e.g. secondary market:
   * primary header scrolls away, tab row becomes the sticky top bar).
   * @default true
   */
  sticky?: boolean;
  /**
   * Enables scroll elevation (drop shadow + blur) after initial scroll.
   * @default true
   */
  elevatedOnScroll?: boolean;
  /** Убирает нижний border у шапки — линия задаётся снаружи (каталог и т.п.). */
  flushBottom?: boolean;
};

function HeaderHelpLink({
  className,
  label,
  active,
  expanded,
  controlsId,
  onMouseEnter,
  onFocus,
  onClick,
}: {
  className?: string;
  label: string;
  active?: boolean;
  expanded?: boolean;
  controlsId?: string;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  onClick?: () => void;
}) {
  return (
    <Link
      href={ROUTES.support}
      className={cn(headerIconShellClass, active && "text-white bg-white/12", className)}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-haspopup="true"
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onClick={(e) => {
        onClick?.();
        if (expanded) e.preventDefault();
      }}
    >
      <CircleHelp className="size-[18px]" strokeWidth={1.75} aria-hidden />
    </Link>
  );
}

export function DashboardHeader({
  sticky = true,
  elevatedOnScroll = false,
  flushBottom = false,
}: DashboardHeaderProps = {}) {
  const { t } = useI18n();
  const wallet = useHeaderWalletBalance();
  const navItems = useLocalizedNavItems();
  const pathname = usePathname();
  const [hash, setHash] = React.useState("");
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [headerElevated, setHeaderElevated] = React.useState(false);
  const { profileOpen: mobileProfileDrawerOpen, openProfileDrawer, closeProfileDrawer, setTabBarHidden } =
    useMobileTabBarShell();
  const { setOverlayOpen } = useDashboardHeaderOverlay();
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [portalReady, setPortalReady] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const closeMenuTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const t = window.requestAnimationFrame(() => setPortalReady(true));
    return () => window.cancelAnimationFrame(t);
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const cancelCloseMenuTimer = React.useCallback(() => {
    if (closeMenuTimerRef.current != null) {
      window.clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
  }, []);

  const scheduleCloseMenu = React.useCallback(() => {
    cancelCloseMenuTimer();
    closeMenuTimerRef.current = window.setTimeout(() => {
      setExpandedKey(null);
      setProfileOpen(false);
      setSupportOpen(false);
      closeMenuTimerRef.current = null;
    }, 200);
  }, [cancelCloseMenuTimer]);

  React.useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    read();
    const onHashChange = () => {
      read();
      if (closeMenuTimerRef.current != null) {
        window.clearTimeout(closeMenuTimerRef.current);
        closeMenuTimerRef.current = null;
      }
      setExpandedKey(null);
      setProfileOpen(false);
      setSupportOpen(false);
      setMobileMenuOpen(false);
      closeProfileDrawer();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [closeProfileDrawer]);

  const onHoverOpen = React.useCallback((id: string) => {
    cancelCloseMenuTimer();
    setProfileOpen(false);
    setSupportOpen(false);
    setExpandedKey(id);
  }, [cancelCloseMenuTimer]);

  const onToggle = React.useCallback((id: string) => {
    cancelCloseMenuTimer();
    setProfileOpen(false);
    setSupportOpen(false);
    setExpandedKey((k) => (k === id ? null : id));
  }, [cancelCloseMenuTimer]);

  const closeSubnav = React.useCallback(() => {
    cancelCloseMenuTimer();
    setExpandedKey(null);
    setProfileOpen(false);
    setSupportOpen(false);
    setMobileMenuOpen(false);
    closeProfileDrawer();
  }, [cancelCloseMenuTimer, closeProfileDrawer]);

  const closeMobileMenu = React.useCallback(() => setMobileMenuOpen(false), []);

  const headerOverlayOpen = expandedKey != null || profileOpen || supportOpen || mobileMenuOpen;

  React.useLayoutEffect(() => {
    setOverlayOpen(headerOverlayOpen);
  }, [headerOverlayOpen, setOverlayOpen]);

  React.useEffect(() => {
    return () => setOverlayOpen(false);
  }, [setOverlayOpen]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelCloseMenuTimer();
        setExpandedKey(null);
        setProfileOpen(false);
        setSupportOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelCloseMenuTimer]);

  React.useEffect(() => {
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const el = headerRef.current;
      if (!el || (!expandedKey && !profileOpen && !supportOpen)) return;
      const target = e.target as Node;
      if (!el.contains(target)) {
        cancelCloseMenuTimer();
        setExpandedKey(null);
        setProfileOpen(false);
        setSupportOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expandedKey, profileOpen, supportOpen, cancelCloseMenuTimer]);

  React.useEffect(() => {
    return () => {
      if (closeMenuTimerRef.current != null) {
        window.clearTimeout(closeMenuTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    closeProfileDrawer();
  }, [pathname, closeProfileDrawer]);

  React.useEffect(() => {
    setTabBarHidden(mobileMenuOpen);
  }, [mobileMenuOpen, setTabBarHidden]);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    const onScroll = () => {
      setHeaderElevated(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openItem = navItems.find((i) => i.id === expandedKey);

  /** Портальный фон: только для полноширинных mega-menu (не split-flyout и не профиль). */
  const showFlyoutBackdrop =
    portalReady && expandedKey != null && !isSplitMegamenuId(expandedKey);

  const mobileMenuLayer =
    portalReady
      ? createPortal(
          <DashboardMobileMenu
            open={mobileMenuOpen}
            navItems={navItems}
            pathname={pathname}
            hash={hash}
            onClose={closeMobileMenu}
            navItemActive={navItemActive}
            t={t}
            isAuthenticated={wallet.isAuthenticated}
            balanceShort={wallet.balanceShort}
            balanceError={wallet.error}
            depositHref={DEPOSIT_HREF}
            loginHref={ROUTES.login}
          />,
          document.body,
        )
      : null;

  const headerFlyoutBackdrop = showFlyoutBackdrop ? (
      <div
        role="presentation"
        aria-hidden
        className="fixed inset-0 z-[105] animate-dashboard-megamenu-in bg-black/60 motion-reduce:animate-none"
        style={{
          WebkitBackdropFilter: "blur(40px) brightness(0.42) saturate(0.92)",
          backdropFilter: "blur(40px) brightness(0.42) saturate(0.92)",
        }}
        onClick={closeSubnav}
      />
    ) : null;

  return (
    <>
      {headerFlyoutBackdrop ? createPortal(headerFlyoutBackdrop, document.body) : null}
      {mobileMenuLayer}
      <header
        ref={headerRef}
        className={cn(
          flushBottom ? "border-b-0" : "border-b border-transparent",
          "!bg-black transition-shadow duration-300 ease-out",
          sticky ? "sticky top-0 z-[110]" : "relative z-[110] shrink-0",
          elevatedOnScroll && headerElevated && "shadow-[0_8px_30px_rgba(0,0,0,0.38)]",
        )}
        onMouseEnter={cancelCloseMenuTimer}
        onMouseLeave={scheduleCloseMenu}
      >
      <div className="w-full">
      <div className="flex h-12 w-full items-center gap-2 px-3 sm:h-14 sm:gap-3 sm:px-4 lg:h-[64px] lg:px-5">
        {/* Brand + nav */}
        <div className="flex min-w-0 flex-1 items-center gap-0 sm:gap-1">
          <div className="flex shrink-0 items-center pr-0">
            <SplitonLogo />
          </div>

          <HeaderDivider className="mx-1 hidden lg:block" />

          <nav
            className="hidden min-w-0 items-center gap-0.5 overflow-x-auto overflow-y-visible lg:flex lg:overflow-visible lg:gap-1"
            aria-label={t("navigation.header.mainNav")}
          >
            {navItems.map((item) => (
              <NavTrigger
                key={item.id}
                item={item}
                pathname={pathname}
                hash={hash}
                expandedKey={expandedKey}
                onToggle={onToggle}
                onHoverOpen={onHoverOpen}
                onNavigate={closeSubnav}
                isDesktop={isDesktop}
                size="desktop"
                menuAriaLabel={tf(t("navigation.header.navMenu"), { label: item.label })}
              />
            ))}
          </nav>
        </div>

        <DashboardHeaderSearchInline />

        {/* Actions + utilities */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {wallet.isAuthenticated ? (
            <Link
              href={DEPOSIT_HREF}
              className="hidden h-9 shrink-0 items-center rounded-full bg-white/10 px-4 text-[12px] font-medium text-white transition hover:bg-white/16 active:scale-[0.98] lg:inline-flex"
            >
              {t("navigation.header.depositUsdt")}
            </Link>
          ) : (
            <Link
              href={ROUTES.login}
              className="hidden h-9 shrink-0 items-center rounded-lg bg-white/10 px-3.5 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-white/16 lg:inline-flex"
            >
              {t("navigation.header.login")}
            </Link>
          )}

          {wallet.isAuthenticated ? (
            <details className="relative hidden lg:block">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-white/85 transition-colors marker:hidden hover:bg-white/8 [&::-webkit-details-marker]:hidden">
                <span className="hidden max-w-[8rem] truncate tabular-nums lg:inline">
                  {wallet.balanceShort ?? (wallet.error ? "—" : "…")}
                </span>
                <span className="max-w-[5rem] truncate tabular-nums lg:hidden">
                  {wallet.balanceShort ?? "…"}
                </span>
                <span className="text-white/65">USDT</span>
                <ChevronDown className="size-3.5 text-white/65" strokeWidth={2} aria-hidden />
              </summary>
              <div className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-white/[0.1] bg-[#0a0a0a] py-1 shadow-2xl ring-1 ring-black/60">
                <div className="border-b border-white/[0.06] px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    {t("nav.balance")}
                  </p>
                  <p className="mt-0.5 tabular-nums text-base font-semibold text-white">
                    {wallet.balanceLabel ?? "—"}
                  </p>
                  {wallet.error ? (
                    <p className="mt-1 text-[11px] text-red-300">{wallet.error}</p>
                  ) : null}
                </div>
                <Link
                  href={DEPOSIT_HREF}
                  className="block px-3 py-2 text-sm text-neutral-300 hover:bg-white/[0.05]"
                >
                  {t("navigation.header.depositShort")}
                </Link>
                <Link
                  href={PAYOUTS_HISTORY_HREF}
                  className="block px-3 py-2 text-sm text-neutral-300 hover:bg-white/[0.05]"
                >
                  {t("navigation.header.payoutHistory")}
                </Link>
              </div>
            </details>
          ) : null}

          {wallet.isAuthenticated ? (
            <button
              type="button"
              className={cn(
                headerIconShellClass,
                "lg:hidden",
                mobileProfileDrawerOpen && "bg-white/12 text-white",
              )}
              aria-label={t("navigation.header.profile")}
              aria-expanded={mobileProfileDrawerOpen}
              onClick={() => {
                setExpandedKey(null);
                setProfileOpen(false);
                setMobileMenuOpen(false);
                openProfileDrawer();
              }}
            >
              <User className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </button>
          ) : (
            <Link
              href={ROUTES.login}
              className={cn(headerIconShellClass, "lg:hidden")}
              aria-label={t("navigation.header.login")}
            >
              <User className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </Link>
          )}

          <div className="h-4 w-px bg-white/10 lg:hidden" aria-hidden />

          <button
            type="button"
            className={cn(
              headerIconShellClass,
              "lg:hidden",
              mobileMenuOpen && "bg-white/12 text-white",
            )}
            aria-label={
              mobileMenuOpen
                ? t("navigation.header.mobileMenuClose")
                : t("navigation.header.mobileMenuOpen")
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-dashboard-menu"
            onClick={() => {
              setExpandedKey(null);
              setProfileOpen(false);
              setMobileMenuOpen((prev) => !prev);
            }}
          >
            {mobileMenuOpen ? <X className="size-[18px]" strokeWidth={1.75} aria-hidden /> : <Menu className="size-[18px]" strokeWidth={1.75} aria-hidden />}
          </button>

          <div
            className="relative hidden shrink-0 lg:block"
            onMouseEnter={() => {
              cancelCloseMenuTimer();
              setExpandedKey(null);
              setSupportOpen(false);
              setProfileOpen(true);
            }}
          >
            <button
              type="button"
              className={cn(
                "relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100",
                "text-white/80 hover:bg-white/8 hover:text-white",
                profileOpen && "bg-white/12 text-white",
              )}
              aria-label={t("navigation.header.profile")}
              aria-expanded={profileOpen}
              aria-controls={DASHBOARD_PROFILE_MEGAMENU_ID}
              aria-haspopup="true"
              onFocus={() => {
                cancelCloseMenuTimer();
                setExpandedKey(null);
                setProfileOpen(true);
              }}
              onClick={() => {
                cancelCloseMenuTimer();
                setExpandedKey(null);
                setProfileOpen((p) => !p);
              }}
            >
              <User className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </button>

            {profileOpen && isDesktop ? (
              <ProfileMegamenuFlyout
                onNavigate={closeSubnav}
                className="absolute right-0 top-full z-[120] hidden pt-2 lg:block"
              />
            ) : null}
          </div>

          <HeaderDivider className="mx-0.5 hidden lg:block" />

          <div className="hidden items-center lg:flex">
            <NotificationBell
              apiBasePath="/api/v1/notifications"
              allHref={ROUTES.dashboardNotifications}
              className={headerIconShellClass}
              iconClassName="size-[18px]"
            />
            <div
              className="relative"
              onMouseEnter={() => {
                cancelCloseMenuTimer();
                setExpandedKey(null);
                setProfileOpen(false);
                setSupportOpen(true);
              }}
            >
              <HeaderHelpLink
                label={t("navigation.header.help")}
                active={supportOpen || pathname === ROUTES.support}
                expanded={supportOpen}
                controlsId={DASHBOARD_SUPPORT_MEGAMENU_ID}
                onFocus={() => {
                  cancelCloseMenuTimer();
                  setExpandedKey(null);
                  setProfileOpen(false);
                  setSupportOpen(true);
                }}
                onClick={() => {
                  cancelCloseMenuTimer();
                  setExpandedKey(null);
                  setProfileOpen(false);
                  setSupportOpen((open) => !open);
                }}
              />
              {supportOpen && isDesktop ? (
                <SupportMegamenuFlyout
                  onNavigate={closeSubnav}
                  className="absolute right-0 top-full z-[120] hidden pt-2 lg:block"
                />
              ) : null}
            </div>
            <LanguageSelector variant="dark" buttonClassName="border-0 bg-transparent hover:bg-white/8" />
          </div>
        </div>
      </div>
      </div>

      <DashboardMegamenuPanel openItem={openItem} onNavigate={closeSubnav} />
    </header>
    </>
  );
}
