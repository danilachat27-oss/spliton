"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Globe, Mail } from "@/lib/lucide";

import { LanguageSelector } from "@/components/i18n/language-selector";
import { FooterRegisterQr } from "@/components/layout/footer-register-qr";
import { FooterSoundtrack } from "@/components/layout/footer-soundtrack";
import { useI18n } from "@/components/providers/i18n-provider";
import { BRAND } from "@/constants/brand";
import { SUPPORT_HELPDESK_EMAIL } from "@/constants/support-center";
import { ROUTES } from "@/constants/routes";
import { useFooterLinkGroups } from "@/hooks/use-shell-i18n";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

type FooterHref = { label: string; href: string };

const socials: { label: string; href: string; icon: "telegram" | "x" | "github" | "youtube" | "linkedin" | "mail" }[] = [
  { label: "Telegram", href: "#", icon: "telegram" },
  { label: "X", href: "#", icon: "x" },
  { label: "GitHub", href: "#", icon: "github" },
  { label: "YouTube", href: "#", icon: "youtube" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
  { label: "mail", href: `mailto:${SUPPORT_HELPDESK_EMAIL}`, icon: "mail" },
];

function SocialGlyph({ kind }: { kind: (typeof socials)[number]["icon"] }) {
  const common = "size-[18px]";
  if (kind === "github") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  if (kind === "youtube") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (kind === "linkedin") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (kind === "mail") return <Mail className={common} strokeWidth={1.6} aria-hidden />;
  if (kind === "telegram") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M21.946 2.316a.478.478 0 0 0-.5-.095L2.26 9.85a.476.476 0 0 0 .002.908l5.374 2.09 2.07 6.682a.478.478 0 0 0 .756.228l3.017-2.465 4.678 3.44a.477.477 0 0 0 .73-.52l-2.03-13.857ZM17.1 7.45 7.62 12.721l-.197-3.84 9.677-1.43Z" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FooterLinkColumn({
  title,
  links,
  compact,
}: {
  title: string;
  links: readonly FooterHref[];
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <h3
        className={cn(
          "mb-3 font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:mb-5",
          compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        {title}
      </h3>
      <ul className={cn("text-[14px] leading-snug", compact ? "space-y-2.5" : "space-y-3.5")}>
        {links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            <Link href={l.href} className="text-zinc-500 transition-colors hover:text-zinc-100 text-balance">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({
  className,
  variant = "default",
}: {
  className?: string;
  /** Компактнее на mobile — для лендинга кабинета. */
  variant?: "default" | "compact";
}) {
  const { t } = useI18n();
  const groups = useFooterLinkGroups();
  const year = new Date().getFullYear();
  const compact = variant === "compact";

  return (
    <footer
      data-footer-variant={compact ? "compact" : "default"}
      className={cn(
        "relative z-10 mt-auto overflow-visible bg-black font-sans text-zinc-500",
        compact ? "border-t-0" : "border-t border-white/8",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10",
          compact ? "pb-4 pt-10 sm:pb-8 sm:pt-20 lg:pb-10 lg:pt-24" : "pb-6 pt-16 sm:pb-8 sm:pt-20 lg:pb-10 lg:pt-24",
        )}
      >
        <div className={cn("border-b border-white/8", compact ? "hidden pb-0 sm:block sm:pb-12 md:pb-16" : "pb-12 md:pb-16")}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-2xl space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                {t("footer.promo.eyebrow")}
              </p>
              <p className="text-2xl font-semibold leading-[1.15] tracking-tight text-white md:text-3xl lg:text-[2.15rem]">
                {t("footer.promo.title")}{" "}
                <Link
                  href={ROUTES.news}
                  className="text-zinc-300 underline decoration-white/20 underline-offset-[6px] transition hover:text-white hover:decoration-white/40"
                >
                  {t("footer.promo.titleLink")}
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.news}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 text-xs font-semibold uppercase tracking-wide text-zinc-100 transition hover:border-white/25 hover:bg-white/[0.07]"
              >
                {t("footer.promo.ctaNews")}
              </Link>
              <Link
                href={ROUTES.dashboard}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-wide text-black transition hover:bg-zinc-200"
              >
                {t("footer.promo.ctaDashboard")}
                <ArrowUpRight className="size-3.5 opacity-80" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className={cn("grid lg:grid-cols-12 lg:gap-12 xl:gap-16", compact ? "mt-8 gap-8 sm:mt-14 lg:mt-20" : "mt-14 gap-14 lg:mt-20")}>
          <div className="flex flex-col gap-6 overflow-visible sm:gap-8 lg:col-span-3">
            <div>
              <Link href={ROUTES.home} className="inline-flex w-fit items-center">
                <Image
                  src="/images/LOGO/black-logo-nofon.png"
                  alt={BRAND.name}
                  width={480}
                  height={115}
                  className={cn(
                    "h-16 w-auto object-contain sm:h-[4.5rem] sm:max-w-[420px] md:h-24 md:max-w-[480px]",
                    compact ? "max-w-[300px]" : "max-w-[360px]",
                  )}
                />
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500 sm:mt-4 md:text-[15px]">
                {t("footer.tagline")}
              </p>
            </div>
            <p className="text-[11px] text-zinc-600">
              {tf(t("footer.copyright"), { year: String(year) })}
            </p>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg px-1 py-1">
              <Globe className="size-3.5 text-zinc-500" strokeWidth={1.75} aria-hidden />
              <LanguageSelector
                variant="dark"
                menuAlign="start"
                buttonClassName="h-8 gap-1.5 px-1 py-0 text-xs text-zinc-300"
              />
              <span className="hidden text-xs text-zinc-500 sm:inline">{t("footer.localeSuffix")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:col-span-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
            <FooterLinkColumn compact={compact} title={groups.sections.assets} links={groups.assets} />
            <FooterLinkColumn compact={compact} title={groups.sections.market} links={groups.market} />
            <FooterLinkColumn compact={compact} title={groups.sections.learn} links={groups.learn} />
            <FooterLinkColumn compact={compact} title={groups.sections.services} links={groups.services} />
            <FooterLinkColumn compact={compact} title={groups.sections.account} links={groups.account} />
            <FooterLinkColumn compact={compact} title={groups.sections.legal} links={groups.legal} />
          </div>

          <div className={cn("lg:col-span-3", compact && "hidden sm:block")}>
            <FooterRegisterQr />
          </div>
        </div>

        <div
          className={cn("relative", compact ? "mt-8 hidden md:mt-24 md:block" : "mt-16 md:mt-24")}
          style={{ fontSize: "clamp(4.5rem, 22vw, 14rem)" }}
        >
          <FooterSoundtrack
            variant="around-title"
            className="pointer-events-none absolute inset-x-0 -top-2 z-0 md:-top-3"
          />
          <div className="pointer-events-none select-none text-center leading-[0.82]">
            <p
              className="bg-gradient-to-b from-white/[0.16] via-white/[0.07] to-transparent bg-clip-text font-semibold tracking-[-0.05em] text-transparent"
              aria-hidden
            >
              {BRAND.name}
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-2xl md:mt-12">
            <Image
              src="/images/sotsety.png"
              alt=""
              fill
              className="object-cover object-right"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/88 via-black/72 to-black/55" aria-hidden />
            <div className="relative flex flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between md:gap-6 md:py-12">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  {t("footer.community.eyebrow")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <Link
                      key={s.icon}
                      href={s.href}
                      aria-label={s.icon === "mail" ? t("footer.social.mail") : s.label}
                      className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-zinc-400 backdrop-blur-sm transition hover:border-white/18 hover:bg-white/[0.05] hover:text-zinc-100"
                    >
                      <SocialGlyph kind={s.icon} />
                    </Link>
                  ))}
                </div>
              </div>

              <p className="max-w-md text-center text-[11px] leading-relaxed text-zinc-500 md:text-left">
                {t("footer.community.tagline")}
              </p>

              <Link
                href={ROUTES.systemStatus}
                className="inline-flex items-center gap-2 self-center rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] text-zinc-300 backdrop-blur-sm transition hover:border-white/16 hover:text-zinc-100 md:self-auto"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/50 opacity-40" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400/90" />
                </span>
                {t("footer.community.statusLink")}
              </Link>
            </div>
          </div>
        </div>

        <div className={cn("flex flex-col items-start justify-between gap-3 border-t border-white/6 pt-6 text-[12px] text-zinc-600 sm:flex-row sm:items-center sm:pt-8", compact && "mt-6 sm:mt-10")}>
          <p>
            <span className="font-medium text-zinc-400">{BRAND.name}</span> · {year} · {t("footer.rights")}
          </p>
          <p className="text-[11px] text-zinc-600">{t("footer.platformLabel")}</p>
        </div>
      </div>
    </footer>
  );
}
