"use client";

import "./trust-cta-aurora.css";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";
import { useMemo } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { TrustCabinetVerifyScene } from "@/components/trust/trust-cabinet-verify-scene";
import { TrustOperationFlowScene } from "@/components/trust/trust-operation-flow-scene";
import { TrustUpdatesScene } from "@/components/trust/trust-updates-scene";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const panel = "rounded-2xl bg-white px-4 py-5 sm:rounded-3xl sm:px-8 sm:py-8";
const metricTile =
  "rounded-[24px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:rounded-[28px] sm:px-6 sm:py-6 sm:shadow-none";

const TRUST_ICON_BASE = "/images/центрдвоерие";

type TrustMetric = {
  step: string;
  label: string;
  value: string;
  hint: string;
  href?: string;
  hrefLabel?: string;
};

type TrustSectionLink = { label: string; href: string };

type TrustSection = {
  imageSrc: string;
  title: string;
  body: string;
  detail: string;
  href?: string;
  hrefLabel?: string;
  links?: TrustSectionLink[];
};

type TrustControl = { title: string; text: string };

function SectionHeading({ id, title, subtitle }: { id?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center sm:text-left">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl lg:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-neutral-600 sm:mx-0 sm:text-sm">{subtitle}</p>
      ) : null}
    </div>
  );
}

function SectionButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800 sm:h-9 sm:w-auto"
    >
      {children}
    </Link>
  );
}

function SectionRow({ imageSrc, title, body, detail, href, hrefLabel, links }: TrustSection) {
  const { t } = useI18n();

  return (
    <article className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <div className="relative mx-auto size-24 shrink-0 sm:mx-0 sm:size-28 lg:size-32">
        <Image src={imageSrc} alt="" fill className="object-contain" sizes="128px" unoptimized />
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h3 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-700 sm:text-sm">{body}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500 sm:text-sm">{detail}</p>
        {links?.length ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
            {links.map((link) => (
              <SectionButton key={link.href} href={link.href}>
                {link.label}
              </SectionButton>
            ))}
          </div>
        ) : href ? (
          <div className="mt-4 flex w-full justify-center sm:w-auto sm:justify-start">
            <SectionButton href={href}>
              <span className="inline-flex items-center gap-1.5">
                {hrefLabel ?? t("trust.link.more")}
                <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </SectionButton>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function TrustCenterContent() {
  const { t } = useI18n();

  const trustMetrics = useMemo<TrustMetric[]>(
    () => [
      {
        step: "01",
        label: t("trust.metrics.m1.label"),
        value: t("trust.metrics.m1.value"),
        hint: t("trust.metrics.m1.hint"),
      },
      {
        step: "02",
        label: t("trust.metrics.m2.label"),
        value: t("trust.metrics.m2.value"),
        hint: t("trust.metrics.m2.hint"),
      },
      {
        step: "03",
        label: t("trust.metrics.m3.label"),
        value: t("trust.metrics.m3.value"),
        hint: t("trust.metrics.m3.hint"),
      },
      {
        step: "04",
        label: t("trust.metrics.m4.label"),
        value: t("trust.metrics.m4.value"),
        hint: t("trust.metrics.m4.hint"),
        href: ROUTES.systemStatus,
        hrefLabel: t("trust.metrics.m4.hrefLabel"),
      },
    ],
    [t],
  );

  const sections = useMemo<TrustSection[]>(
    () => [
      {
        imageSrc: `${TRUST_ICON_BASE}/как работает.png`,
        title: t("trust.section.howItWorks.title"),
        body: t("trust.section.howItWorks.body"),
        detail: t("trust.section.howItWorks.detail"),
      },
      {
        imageSrc: `${TRUST_ICON_BASE}/Защита средств и ledger.png`,
        title: t("trust.section.ledger.title"),
        body: t("trust.section.ledger.body"),
        detail: t("trust.section.ledger.detail"),
      },
      {
        imageSrc: `${TRUST_ICON_BASE}/Статус системы.png`,
        title: t("trust.section.systemStatus.title"),
        body: t("trust.section.systemStatus.body"),
        detail: t("trust.section.systemStatus.detail"),
        href: ROUTES.systemStatus,
        hrefLabel: t("trust.section.systemStatus.hrefLabel"),
      },
      {
        imageSrc: `${TRUST_ICON_BASE}/поддержка.png`,
        title: t("trust.section.support.title"),
        body: t("trust.section.support.body"),
        detail: t("trust.section.support.detail"),
        links: [
          { label: t("trust.link.support"), href: ROUTES.support },
          { label: t("trust.link.disputes"), href: ROUTES.dashboardDisputes },
        ],
      },
      {
        imageSrc: `${TRUST_ICON_BASE}/Риски и раскрытия.png`,
        title: t("trust.section.risks.title"),
        body: t("trust.section.risks.body"),
        detail: t("trust.section.risks.detail"),
      },
      {
        imageSrc: `${TRUST_ICON_BASE}/Комиссии и документы.png`,
        title: t("trust.section.fees.title"),
        body: t("trust.section.fees.body"),
        detail: t("trust.section.fees.detail"),
        links: [
          { label: t("trust.link.fees"), href: ROUTES.fees },
          { label: t("trust.link.statements"), href: ROUTES.dashboardStatements },
          { label: t("trust.link.documents"), href: ROUTES.dashboardDocuments },
        ],
      },
    ],
    [t],
  );

  const controls = useMemo<TrustControl[]>(
    () => [
      { title: t("trust.controls.withdrawLimits.title"), text: t("trust.controls.withdrawLimits.text") },
      { title: t("trust.controls.operationReview.title"), text: t("trust.controls.operationReview.text") },
      { title: t("trust.controls.auditLog.title"), text: t("trust.controls.auditLog.text") },
      { title: t("trust.controls.kyc.title"), text: t("trust.controls.kyc.text") },
    ],
    [t],
  );

  return (
    <div className="space-y-6 pb-4 sm:space-y-10 sm:pb-6">
      <section
        className="rounded-2xl bg-white px-4 py-5 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0"
        aria-label={t("trust.metrics.aria")}
      >
        <SectionHeading
          title={t("trust.metrics.heading.title")}
          subtitle={t("trust.metrics.heading.subtitle")}
        />
        <div className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {trustMetrics.map((metric) => (
            <article key={metric.step} className={cn(metricTile, "flex flex-col")}>
              <p className="font-mono text-[2.25rem] font-semibold tabular-nums leading-none tracking-tight text-neutral-200 sm:text-5xl">
                {metric.step}
              </p>
              <p className="mt-3 text-sm font-semibold leading-snug text-neutral-900">{metric.label}</p>
              <p className="mt-1.5 text-base font-semibold tracking-tight text-neutral-800 sm:text-[17px]">{metric.value}</p>
              <p className="mt-3 flex-1 text-[13px] leading-relaxed text-neutral-600 sm:text-sm">{metric.hint}</p>
              {metric.href ? (
                <Link
                  href={metric.href}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 underline-offset-2 hover:underline"
                >
                  {metric.hrefLabel ?? t("trust.link.more")}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <TrustUpdatesScene />

      <section className={panel} aria-labelledby="trust-pillars-heading">
        <SectionHeading
          id="trust-pillars-heading"
          title={t("trust.pillars.title")}
          subtitle={t("trust.pillars.subtitle")}
        />
        <div className="mt-6 divide-y divide-neutral-100 sm:mt-10">
          {sections.map((section) => (
            <div key={section.title} className="py-6 first:pt-0 last:pb-0 sm:py-10">
              <SectionRow {...section} />
            </div>
          ))}
        </div>
      </section>

      <TrustOperationFlowScene />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className={panel} aria-labelledby="trust-controls-heading">
          <SectionHeading
            id="trust-controls-heading"
            title={t("trust.controls.title")}
            subtitle={t("trust.controls.subtitle")}
          />
          <ul className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
            {controls.map(({ title, text }) => (
              <li key={title}>
                <p className="text-sm font-semibold text-neutral-900">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={panel} aria-labelledby="trust-verify-heading">
          <SectionHeading
            id="trust-verify-heading"
            title={t("trust.verify.title")}
            subtitle={t("trust.verify.subtitle")}
          />
          <div className="mt-6 sm:mt-8">
            <TrustCabinetVerifyScene />
          </div>
        </section>
      </div>

      <section
        className="trust-cta-aurora relative min-h-[220px] overflow-hidden rounded-2xl text-center ring-1 ring-black/30 sm:min-h-0 sm:rounded-3xl"
        aria-labelledby="trust-cta-heading"
      >
        <Image
          src={`${TRUST_ICON_BASE}/нижеийблок.png`}
          alt=""
          fill
          className="trust-cta-aurora__image object-cover object-[center_42%] sm:object-center"
          sizes="(max-width: 1320px) 100vw, 1320px"
          unoptimized
        />
        <div className="trust-cta-aurora__layer trust-cta-aurora__layer--1" aria-hidden />
        <div className="trust-cta-aurora__layer trust-cta-aurora__layer--2" aria-hidden />
        <div className="trust-cta-aurora__layer trust-cta-aurora__layer--3" aria-hidden />
        <div className="trust-cta-aurora__rim" aria-hidden />
        <div className="trust-cta-aurora__content relative flex min-h-[220px] flex-col items-center justify-center px-4 py-8 sm:min-h-0 sm:px-8 sm:py-12">
          <h2 id="trust-cta-heading" className="text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-3xl">
            {t("trust.cta.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-white/72 sm:text-sm">
            {t("trust.cta.subtitle")}
          </p>
          <div className="mt-5 flex w-full max-w-xs flex-col gap-2.5 sm:mt-6 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
            <Link
              href={ROUTES.systemStatus}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#B7F500] px-5 text-sm font-semibold text-black transition hover:bg-[#c8ff3d] sm:w-auto"
            >
              {t("trust.cta.systemStatus")}
            </Link>
            <Link
              href={ROUTES.support}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
            >
              {t("trust.cta.support")}
            </Link>
            <Link
              href={ROUTES.fees}
              className="inline-flex h-10 items-center justify-center text-sm font-medium text-white/85 underline-offset-2 transition hover:text-white hover:underline sm:h-11"
            >
              {t("trust.cta.fees")}
            </Link>
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-2xl px-2 text-center text-[11px] leading-relaxed text-neutral-500 sm:px-0 sm:text-xs">
        {t("trust.disclaimer")}
      </p>
    </div>
  );
}
