"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  Gavel,
  Minus,
  Percent,
  Plus,
  Scale,
} from "@/lib/lucide";

import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/components/providers/i18n-provider";
import { GuideSectionShell } from "@/features/guide/selection/ui/guide-section-shell";
import { cn } from "@/lib/utils";

const RULES_NAV = [
  { id: "rules-top", labelKey: "secondaryMarket.rules.navIntro" },
  { id: "rules-at-a-glance", labelKey: "secondaryMarket.rules.navSummary" },
  { id: "rules-risk", labelKey: "secondaryMarket.rules.navImportant" },
  { id: "rules-principles", labelKey: "secondaryMarket.rules.navPrinciples" },
  { id: "rules-depth", labelKey: "secondaryMarket.rules.navDetails" },
] as const;

const HERO_PILLS = [
  { href: "#rules-at-a-glance", labelKey: "secondaryMarket.rules.navSummary", hint: "fees · min" },
  { href: "#rules-risk", labelKey: "secondaryMarket.rules.navRisks", hint: "disclaimer" },
  { href: "#rules-principles", labelKey: "secondaryMarket.rules.navExecution", hint: "matching" },
  { href: "#rules-depth", labelKey: "secondaryMarket.rules.navRules", hint: "accordion" },
] as const;

const RULES_IMAGES = {
  hero: "/images/Сервисы площадки/1.png",
  taker: "/images/myactiv/metrik.png",
  maker: "/images/catalogbuy/2.png",
  minOrder: "/images/assetsunt/backgraund.png",
  risk: "/images/fees/back.png",
  principles: "/images/Сервисы площадки/2.png",
  cta: "/images/gotov/1.png",
} as const;

function RulesInPageNav() {
  const { t } = useI18n();
  const [active, setActive] = React.useState<string>(RULES_NAV[0]?.id ?? "rules-top");

  React.useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-rules-section]"));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.target.id)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const next = visible[0]?.target.id;
        if (next) setActive(next);
      },
      { root: null, rootMargin: "-12% 0px -55% 0px", threshold: [0.08, 0.2, 0.35, 0.55] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label={t("secondaryMarket.rules.ariaToc")} className="sticky top-28">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("secondaryMarket.rules.onThisPage")}</div>
      <ul className="mt-3 space-y-1">
        {RULES_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-[#B7F500]/14 font-medium text-[#d4f570]"
                    : "text-zinc-500 hover:bg-white/4 hover:text-zinc-200",
                )}
              >
                {t(item.labelKey)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function RulesPhotoStatCard({
  label,
  value,
  hint,
  imageSrc,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  imageSrc: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="relative min-h-[188px] overflow-hidden rounded-2xl ring-1 ring-white/8">
      <Image src={imageSrc} alt="" fill className="object-cover object-center" sizes="(max-width: 640px) 100vw, 320px" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/72 to-black/45" aria-hidden />
      <div className="relative z-10 flex h-full flex-col p-6 md:p-7">
        <div className="flex size-11 items-center justify-center rounded-lg bg-black/45 ring-1 ring-white/10 backdrop-blur-sm">
          {icon}
        </div>
        <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-zinc-400">{hint}</p>
      </div>
    </article>
  );
}

function RulesPhotoBand({
  imageSrc,
  gradient = "from-black/92 via-black/78 to-black/55",
  className,
  children,
}: {
  imageSrc: string;
  gradient?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl ring-1 ring-white/8", className)}>
      <Image src={imageSrc} alt="" fill className="object-cover object-center" sizes="(max-width: 1400px) 100vw, 1400px" />
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-r", gradient)} aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function RuleDetails({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <details
      id={id}
      className="group overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/8 backdrop-blur-sm [&_summary::-webkit-details-marker]:hidden"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-white/4 md:px-5 md:py-5">
        <span className="text-left text-[15px] font-medium leading-snug text-white md:text-base">{title}</span>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/50 text-white ring-1 ring-white/10 transition-colors group-open:bg-[#B7F500]/14 group-open:text-[#d4f570]"
          aria-hidden
        >
          <Plus className="size-4 group-open:hidden" strokeWidth={1.75} />
          <Minus className="hidden size-4 group-open:block" strokeWidth={1.75} />
        </span>
      </summary>
      <div className="space-y-2 bg-black/35 px-4 pb-4 pt-0 text-sm leading-relaxed text-zinc-400 md:px-5 md:pb-5 md:text-[15px]">
        {children}
      </div>
    </details>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-2 size-1 shrink-0 rounded-full bg-[#B7F500]/70" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

export function SecondaryMarketRulesTab() {
  const { t } = useI18n();

  return (
    <div className="scroll-smooth bg-black pb-8 pt-2 md:pb-12 md:pt-4">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex gap-10 lg:gap-14 xl:gap-16">
          <div className="min-w-0 flex-1 space-y-10 md:space-y-14 lg:space-y-16">
            {/* Hero — как guide/selection + landing */}
            <section id="rules-top" data-rules-section className="scroll-mt-28">
              <div className="relative isolate min-h-[200px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 md:min-h-[min(32vh,280px)]">
                <Image
                  src={RULES_IMAGES.hero}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1400px) 100vw, 1400px"
                  priority
                />
                <div
                  className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-r from-black/88 via-black/55 to-black/25"
                  aria-hidden
                />
                <div className="relative z-10 flex min-h-[200px] flex-col justify-end px-5 py-6 md:min-h-[min(32vh,280px)] md:px-8 md:py-8">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    Spliton · Secondary · Market rules
                  </p>
                  <h1 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.55)] md:text-3xl lg:text-4xl">
                    {t("secondaryMarket.rules.heroTitle")}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
                    {t("secondaryMarket.rules.heroLead")}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {HERO_PILLS.map((pill) => (
                      <a
                        key={pill.href}
                        href={pill.href}
                        className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3.5 py-2 text-[13px] text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black/60 hover:ring-[#B7F500]/35"
                      >
                        <span className="font-medium">{t(pill.labelKey)}</span>
                        <span className="text-[11px] text-zinc-400">{pill.hint}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 max-w-3xl space-y-3 text-sm leading-relaxed text-zinc-500 md:text-[15px]">
                <p>{t("secondaryMarket.rules.intro")}</p>
              </div>
            </section>

            {/* Сводка — KPI с фото как на каталоге */}
            <section id="rules-at-a-glance" data-rules-section className="scroll-mt-28">
              <GuideSectionShell
                title={t("secondaryMarket.rules.summaryTitle")}
                subtitle={t("secondaryMarket.rules.summarySubtitle")}
                headerAlign="left"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
                  <RulesPhotoStatCard
                    label={t("secondaryMarket.rules.takerLabel")}
                    value="0,15%"
                    hint={t("secondaryMarket.rules.takerHint")}
                    imageSrc={RULES_IMAGES.taker}
                    icon={<Percent className="size-[18px] text-[#B7F500]/90" strokeWidth={1.35} aria-hidden />}
                  />
                  <RulesPhotoStatCard
                    label={t("secondaryMarket.rules.makerLabel")}
                    value="0,08%"
                    hint={t("secondaryMarket.rules.makerHint")}
                    imageSrc={RULES_IMAGES.maker}
                    icon={<Percent className="size-[18px] text-[#B7F500]/90" strokeWidth={1.35} aria-hidden />}
                  />
                  <RulesPhotoStatCard
                    label={t("secondaryMarket.rules.minOrderLabel")}
                    value="10 USDT"
                    hint={t("secondaryMarket.rules.minOrderHint")}
                    imageSrc={RULES_IMAGES.minOrder}
                    icon={<Scale className="size-[18px] text-[#B7F500]/90" strokeWidth={1.35} aria-hidden />}
                  />
                </div>
              </GuideSectionShell>
            </section>

            {/* Риск — фото-панель как на fees/trust */}
            <section id="rules-risk" data-rules-section className="scroll-mt-28">
              <GuideSectionShell
                title={t("secondaryMarket.rules.importantTitle")}
                subtitle={t("secondaryMarket.rules.riskSubtitle")}
                headerAlign="left"
              >
                <RulesPhotoBand imageSrc={RULES_IMAGES.risk} className="p-5 md:p-8">
                  <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                    <article className="rounded-xl bg-black/40 p-5 ring-1 ring-white/10 backdrop-blur-sm md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-black/50 ring-1 ring-white/10">
                          <AlertTriangle className="size-[18px] text-amber-400/90" strokeWidth={1.35} aria-hidden />
                        </div>
                        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
                          R01
                        </span>
                      </div>
                      <p className="mt-5 text-[15px] font-medium leading-snug text-zinc-100 md:text-base md:leading-relaxed">
                        {t("secondaryMarket.rules.riskR01")}
                      </p>
                    </article>
                    <article className="rounded-xl bg-black/40 p-5 ring-1 ring-white/10 backdrop-blur-sm md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-black/50 ring-1 ring-white/10">
                          <BookOpen className="size-[18px] text-[#B7F500]/90" strokeWidth={1.35} aria-hidden />
                        </div>
                        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
                          R02
                        </span>
                      </div>
                      <p className="mt-5 text-[15px] font-medium leading-snug text-zinc-100 md:text-base md:leading-relaxed">
                        {t("secondaryMarket.rules.riskR02")}
                      </p>
                    </article>
                  </div>
                </RulesPhotoBand>
              </GuideSectionShell>
            </section>

            {/* Принципы — split на фото */}
            <section id="rules-principles" data-rules-section className="scroll-mt-28">
              <GuideSectionShell
                title={t("secondaryMarket.rules.principlesTitle")}
                subtitle={t("secondaryMarket.rules.principlesSubtitle")}
                headerAlign="left"
              >
                <RulesPhotoBand imageSrc={RULES_IMAGES.principles} gradient="from-black/90 via-black/70 to-black/40">
                  <div className="grid gap-4 p-5 md:grid-cols-2 md:gap-5 md:p-8">
                    <div className="flex gap-4 rounded-xl bg-black/45 p-5 ring-1 ring-white/10 backdrop-blur-sm md:p-6">
                      <div className="mt-1 w-1 shrink-0 self-stretch rounded-full bg-[#B7F500]/55" aria-hidden />
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <Gavel className="size-5 shrink-0 text-[#B7F500]/90" strokeWidth={1.25} aria-hidden />
                          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                            {t("secondaryMarket.rules.matchingTitle")}
                          </div>
                        </div>
                        <p className="mt-3 text-base font-semibold tracking-tight text-white">{t("secondaryMarket.rules.matchingCardTitle")}</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t("secondaryMarket.rules.matchingCardBody")}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 rounded-xl bg-black/45 p-5 ring-1 ring-white/10 backdrop-blur-sm md:p-6">
                      <div className="mt-1 w-1 shrink-0 self-stretch rounded-full bg-[#B7F500]/55" aria-hidden />
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <ArrowLeftRight className="size-5 shrink-0 text-[#B7F500]/90" strokeWidth={1.25} aria-hidden />
                          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                            {t("secondaryMarket.rules.settlementTitle")}
                          </div>
                        </div>
                        <p className="mt-3 text-base font-semibold tracking-tight text-white">{t("secondaryMarket.rules.settlementCardTitle")}</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t("secondaryMarket.rules.settlementCardBody")}</p>
                      </div>
                    </div>
                  </div>
                </RulesPhotoBand>
              </GuideSectionShell>
            </section>

            {/* FAQ + CTA landing */}
            <section id="rules-depth" data-rules-section className="scroll-mt-28">
              <h3 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{t("secondaryMarket.rules.detailsTitle")}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 md:text-base">
                {t("secondaryMarket.rules.detailsIntro")}
              </p>

              <div className="mt-8 space-y-2 rounded-2xl bg-[#0a0a0a]/80 p-3 ring-1 ring-white/6 md:p-4">
                <RuleDetails id="rules-fees" title={t("secondaryMarket.rules.section.fees.title")} defaultOpen>
                  <Bullet>{t("secondaryMarket.rules.section.fees.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.fees.b2")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.fees.b3")}</Bullet>
                </RuleDetails>

                <RuleDetails id="rules-listing" title={t("secondaryMarket.rules.section.listing.title")}>
                  <Bullet>{t("secondaryMarket.rules.section.listing.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.listing.b2")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.listing.b3")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.listing.b4")}</Bullet>
                </RuleDetails>

                <RuleDetails id="rules-orders" title={t("secondaryMarket.rules.section.orders.title")}>
                  <Bullet>{t("secondaryMarket.rules.section.orders.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.orders.b2")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.orders.b3")}</Bullet>
                </RuleDetails>

                <RuleDetails id="rules-execution" title={t("secondaryMarket.rules.section.execution.title")}>
                  <Bullet>{t("secondaryMarket.rules.section.execution.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.execution.b2")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.execution.b3")}</Bullet>
                </RuleDetails>

                <RuleDetails id="rules-settlement" title={t("secondaryMarket.rules.section.settlement.title")}>
                  <Bullet>{t("secondaryMarket.rules.section.settlement.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.settlement.b2")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.settlement.b3")}</Bullet>
                </RuleDetails>

                <RuleDetails id="rules-cancel" title={t("secondaryMarket.rules.section.cancel.title")}>
                  <Bullet>{t("secondaryMarket.rules.section.cancel.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.cancel.b2")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.cancel.b3")}</Bullet>
                </RuleDetails>

                <RuleDetails id="rules-limits" title={t("secondaryMarket.rules.section.limits.title")}>
                  <Bullet>{t("secondaryMarket.rules.section.limits.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.limits.b2")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.limits.b3")}</Bullet>
                </RuleDetails>

                <RuleDetails id="rules-prohibited" title={t("secondaryMarket.rules.section.prohibited.title")}>
                  <Bullet>{t("secondaryMarket.rules.section.prohibited.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.prohibited.b2")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.prohibited.b3")}</Bullet>
                </RuleDetails>

                <RuleDetails id="rules-support" title={t("secondaryMarket.rules.section.support.title")}>
                  <Bullet>{t("secondaryMarket.rules.section.support.b1")}</Bullet>
                  <Bullet>{t("secondaryMarket.rules.section.support.b2")}</Bullet>
                </RuleDetails>
              </div>

              <RulesPhotoBand imageSrc={RULES_IMAGES.cta} className="mt-10">
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
                  <div className="max-w-xl">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                      {t("secondaryMarket.rules.ctaEyebrow")}
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-white md:text-xl">
                      {t("secondaryMarket.rules.ctaTitle")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {t("secondaryMarket.rules.footerNote")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Link
                      href={ROUTES.terms}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:opacity-90"
                    >
                      {t("secondaryMarket.rules.linkTerms")}
                    </Link>
                    <Link
                      href={ROUTES.fees}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-black/45 px-6 text-sm font-medium text-zinc-200 ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-black/60"
                    >
                      {t("secondaryMarket.rules.linkFees")}
                    </Link>
                  </div>
                </div>
              </RulesPhotoBand>
            </section>
          </div>

          <aside className="hidden w-52 shrink-0 xl:block">
            <RulesInPageNav />
          </aside>
        </div>
      </div>
    </div>
  );
}
