"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type {
  DashboardNavBadge,
  DashboardNavItem,
  DashboardNavSubItem,
} from "@/components/dashboard/dashboard-nav";
import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export const DASHBOARD_MEGAMENU_PANEL_ID = "dashboard-header-megamenu";

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

function SubnavBadge({ badge }: { badge: DashboardNavBadge }) {
  const styles: Record<DashboardNavBadge, string> = {
    new: "border border-white/18 bg-white/[0.1] text-[10px] font-bold uppercase tracking-wide text-zinc-100",
    free: "border border-white/10 bg-zinc-900 text-[10px] font-semibold uppercase tracking-wide text-white/85",
    hot: "border border-amber-400/22 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-wide text-amber-100/95",
  };
  const text: Record<DashboardNavBadge, string> = { new: "NEW", free: "FREE", hot: "HOT" };
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
      // eslint-disable-next-line @next/next/no-img-element -- произвольные пути из public
      <img
        src={sub.iconSrc}
        alt=""
        className={cn(
          "relative z-[2] max-h-10 w-auto max-w-[78%] object-contain opacity-[0.38] grayscale transition-all duration-300 group-hover:scale-[1.04] group-hover:opacity-100 group-hover:grayscale-0",
          className
        )}
      />
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
  teaser,
  href,
  onNavigate,
}: {
  title: string;
  teaser: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link href={href} onClick={onNavigate} className={cn(cardShell, cardHover, "p-3 sm:p-3.5")}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.25]">
        <CardInnerWaves className="absolute inset-x-0 bottom-0 h-24 w-full" />
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <h2 className="text-sm font-bold leading-tight tracking-tight text-white sm:text-[15px]">{title}</h2>
        <p className="mt-1.5 text-[12px] leading-snug text-neutral-500">{teaser}</p>
        <MegamenuFeaturedGraphic />
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-25">
          <CardInnerWaves className="size-full" />
        </div>

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
              "text-neutral-500",
            )}
          >
            {sub.description}
          </p>

          <div
            className={cn(
              "relative mt-2 flex min-h-[88px] flex-1 flex-col justify-end overflow-hidden rounded-lg py-3",
              "bg-black/25",
            )}
          >
            <MegamenuLineArt variant={index} className="absolute inset-0 size-full opacity-75" />
            <div className="relative flex flex-1 items-center justify-center py-3">
              <SubItemIcon sub={sub} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export const DASHBOARD_PROFILE_MEGAMENU_ID = "dashboard-profile-megamenu";

/** Пункты меню профиля — те же карточки, что и в mega-menu разделов. */
export const PROFILE_MEGAMENU_ITEMS: DashboardNavSubItem[] = [
  {
    label: "Мой профиль",
    description: "Личные данные, отображение и контакты в кабинете.",
    href: profileDashboardHref("overview"),
    iconHint: "ПР",
  },
  {
    label: "Верификация",
    description: "KYC, документы и статус проверки аккаунта.",
    href: profileDashboardHref("verification"),
    iconHint: "KYC",
  },
  {
    label: "Безопасность",
    description: "Пароль, активные сессии и дополнительная защита.",
    href: profileDashboardHref("security"),
    iconHint: "2F",
  },
  {
    label: "Настройки",
    description: "Уведомления, язык и параметры интерфейса.",
    href: profileDashboardHref("settings"),
    iconHint: "НС",
  },
  {
    label: "Выйти",
    description: "Завершить сеанс на этом устройстве.",
    href: ROUTES.login,
    iconHint: "OUT",
    danger: true,
  },
];

export function DashboardProfileMegamenuPanel({ onNavigate }: { onNavigate: () => void }) {
  const count = PROFILE_MEGAMENU_ITEMS.length;
  const gridCols = `repeat(${count}, minmax(0, 1fr))`;

  return (
    <div
      id={DASHBOARD_PROFILE_MEGAMENU_ID}
      role="region"
      aria-label="Меню профиля"
      className="border-t border-white/[0.05] bg-black/90 backdrop-blur-md supports-backdrop-filter:bg-black/80"
    >
      <div className="w-full px-3 py-2 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5">
        <div
          className="animate-dashboard-megamenu-in relative z-[1] hidden gap-2 min-[1180px]:grid"
          style={{ gridTemplateColumns: gridCols }}
        >
          {PROFILE_MEGAMENU_ITEMS.map((sub, i) => (
            <MegamenuLinkCard key={sub.label} sub={sub} index={i} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="relative z-[1] flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 min-[1180px]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PROFILE_MEGAMENU_ITEMS.map((sub, i) => (
            <div key={sub.label} className="w-[min(240px,78vw)] flex-none snap-start">
              <MegamenuLinkCard sub={sub} index={i} onNavigate={onNavigate} />
            </div>
          ))}
        </div>
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
  if (!openItem?.children?.length) return null;

  const showIntro = openItem.id !== "holdings";
  const teaser =
    openItem.megaTeaser ?? "Выберите пункт ниже или откройте весь раздел на странице.";
  const introTitle =
    openItem.id === "catalog" ? "Каталог релизов" : openItem.id === "holdings" ? "Обзор" : openItem.label;

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
              teaser={teaser}
              href={openItem.href}
              onNavigate={onNavigate}
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
                teaser={teaser}
                href={openItem.href}
                onNavigate={onNavigate}
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
