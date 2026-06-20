import fs from "node:fs";
import path from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActivitySummaryCards } from "@/components/dashboard/assets/activity-summary-cards";
import { AssetsInfoNote } from "@/components/dashboard/assets/assets-info-note";
import { AssetsStatRow } from "@/components/dashboard/assets/assets-stat-row";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { DICTIONARIES } from "@/lib/i18n/dictionaries";
import { WIDGET_MESSAGES } from "@/lib/i18n/widget-messages";
import type { AppLocale } from "@/lib/i18n/types";

const LOCALES: AppLocale[] = ["ru", "en", "es", "pt"];

const WIDGET_FILES_NO_RU_RU = [
  "components/dashboard/assets/activity-summary-cards.tsx",
  "components/dashboard/assets/activity-table-card.tsx",
  "components/dashboard/assets/activity-timeline-card.tsx",
  "components/dashboard/assets/assets-info-note.tsx",
  "components/dashboard/assets/assets-stat-row.tsx",
  "components/dashboard/assets/assets-summary-card.tsx",
  "components/dashboard/assets/assets-metrics-content.tsx",
  "components/dashboard/assets/metrics-charts.tsx",
  "components/dashboard/assets/metrics-toolbar.tsx",
  "components/dashboard/assets/metrics-daily-breakdown-card.tsx",
  "components/dashboard/assets/positions-charts.tsx",
  "components/dashboard/assets/positions-table-card.tsx",
  "components/dashboard/assets/positions-summary-cards.tsx",
  "components/dashboard/assets/positions-structure-cards.tsx",
  "components/dashboard/assets/top-positions-card.tsx",
  "components/dashboard/assets/top-position-cards-grid.tsx",
  "components/dashboard/assets/position-actions-modal.tsx",
  "components/dashboard/assets/overview-etf-flows-chart.tsx",
  "components/dashboard/assets/payouts-balance-scale.tsx",
  "components/dashboard/assets/calculator-page-content.tsx",
  "components/compliance/compliance-eligibility-banner.tsx",
  "components/compliance/eligibility-notice.tsx",
  "components/compliance/legal-consent-modal.tsx",
];

function renderWithLocale(locale: AppLocale, ui: React.ReactElement) {
  return render(<I18nProvider initialLocale={locale}>{ui}</I18nProvider>);
}

function assertNoRawWidgetKeys(text: string) {
  expect(text).not.toMatch(/^activity\.widgets\./);
  expect(text).not.toMatch(/^assets\.widgets\./);
  expect(text).not.toMatch(/^assets\.overview\./);
  expect(text).not.toMatch(/^assets\.metrics\./);
  expect(text).not.toMatch(/^positions\.widgets\./);
  expect(text).not.toMatch(/^calculator\./);
  expect(text).not.toMatch(/^compliance\./);
}

describe("P2 financial widget dictionaries", () => {
  it("widget messages have ru/en parity and es/pt inherit EN", () => {
    const ruKeys = Object.keys(WIDGET_MESSAGES.ru).sort();
    const enKeys = Object.keys(WIDGET_MESSAGES.en).sort();
    expect(enKeys).toEqual(ruKeys);
    expect(Object.keys(WIDGET_MESSAGES.es).length).toBeGreaterThan(0);
    expect(Object.keys(WIDGET_MESSAGES.pt).length).toBeGreaterThan(0);
    for (const key of ruKeys) {
      expect(WIDGET_MESSAGES.es[key], `es:${key}`).toBeTruthy();
      expect(WIDGET_MESSAGES.pt[key], `pt:${key}`).toBeTruthy();
    }
  });

  it("calculator disclaimer key exists in all locales", () => {
    for (const locale of LOCALES) {
      const value = DICTIONARIES[locale]["calculator.disclaimer"];
      expect(value, locale).toBeTruthy();
      assertNoRawWidgetKeys(value);
    }
  });

  it("compliance keys exist in all locales", () => {
    const keys = [
      "compliance.blocking.consentRequired",
      "compliance.operationUnavailable",
      "compliance.modal.acceptSubmit",
      "compliance.modal.saveError",
    ];
    for (const locale of LOCALES) {
      for (const key of keys) {
        const value = DICTIONARIES[locale][key];
        expect(value, `${locale}:${key}`).toBeTruthy();
        assertNoRawWidgetKeys(value);
      }
    }
  });

  it("updated widget files do not hardcode ru-RU locale tags", () => {
    const root = path.join(process.cwd());
    for (const rel of WIDGET_FILES_NO_RU_RU) {
      const filePath = path.join(root, rel);
      const src = fs.readFileSync(filePath, "utf8");
      expect(src, rel).not.toMatch(/ru-RU/);
    }
  });
});

describe("P2 financial widget renders", () => {
  it.each(LOCALES)("ActivitySummaryCards renders without raw keys (%s)", (locale) => {
    renderWithLocale(
      locale,
      <ActivitySummaryCards totalOps="12" deposits="3" secondaryTrades="5" latest="2h" />,
    );
    const label = DICTIONARIES[locale]["activity.widgets.summaryTotalOps"];
    expect(screen.getByText(label)).toBeInTheDocument();
    assertNoRawWidgetKeys(label);
  });

  it.each(LOCALES)("AssetsInfoNote renders localized body (%s)", (locale) => {
    renderWithLocale(locale, <AssetsInfoNote />);
    const body = DICTIONARIES[locale]["assets.widgets.infoNoteBody"];
    expect(screen.getByText(body)).toBeInTheDocument();
    assertNoRawWidgetKeys(body);
  });

  it.each(LOCALES)("AssetsStatRow renders stat labels (%s)", (locale) => {
    renderWithLocale(locale, <AssetsStatRow />);
    const label = DICTIONARIES[locale]["assets.widgets.stat.activeReleases"];
    expect(screen.getByText(label)).toBeInTheDocument();
    assertNoRawWidgetKeys(label);
  });
});
