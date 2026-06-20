"use client";

import Image from "next/image";

import { useI18n } from "@/components/providers/i18n-provider";
import {
  GUIDE_COMPARISON_RELEASES,
  GUIDE_COMPARISON_ROWS,
  type GuideComparisonReleaseId,
} from "@/constants/guide/selection";
import { cn } from "@/lib/utils";

import "./guide-comparison.css";

const ROW_LABEL_KEYS = {
  yield: "guide.comparison.row.yield",
  frequency: "guide.comparison.row.frequency",
  holderShare: "guide.comparison.row.holderShare",
  demand: "guide.comparison.row.demand",
  liquidity: "guide.comparison.row.liquidity",
} as const;

function ComparisonReleaseCard({ releaseId }: { releaseId: GuideComparisonReleaseId }) {
  const { t } = useI18n();
  const release = GUIDE_COMPARISON_RELEASES.find((r) => r.id === releaseId)!;

  return (
    <article className="guide-comparison-release font-mono text-[13px] tabular-nums tracking-tight">
      <div className="guide-comparison-release-cover">
        <Image
          src={release.cover}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 360px"
        />
      </div>
      <div className="guide-comparison-release-body">
        <span className="guide-comparison-release-tag">{t(`guide.comparison.slot.${releaseId}`)}</span>
        <h3 className="mt-1 truncate font-sans text-lg font-semibold tracking-tight text-white">
          {t(`guide.comparison.release.${releaseId}`)}
        </h3>
        <p className="truncate text-sm text-zinc-500">{t(`guide.comparison.release.${releaseId}.artist`)}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          {t(`guide.comparison.release.${releaseId}.genre`)}
        </p>
        <p className="guide-comparison-release-yield">{t("guide.comparison.row.yield")}</p>
        <p className="guide-comparison-release-yield-val">{t(`guide.comparison.val.yield.${releaseId}`)}</p>
      </div>
    </article>
  );
}

export function GuideComparisonDemo() {
  const { t } = useI18n();

  return (
    <div className="guide-comparison-layout">
      <div className="guide-comparison-cards">
        <ComparisonReleaseCard releaseId="a" />
        <ComparisonReleaseCard releaseId="b" />
      </div>

      <div className="guide-comparison-metrics">
        <div className="guide-comparison-metrics-head">
          <span className="guide-comparison-metrics-title">{t("guide.comparison.metricsTitle")}</span>
          <span className="guide-comparison-metrics-badge">{t("guide.comparison.badge.example")}</span>
        </div>

        {GUIDE_COMPARISON_ROWS.map((row, index) => (
          <div key={row.id} className="guide-comparison-metric">
            <div className="guide-comparison-metric-label">
              <span className="guide-comparison-metric-num">{index + 1}</span>
              <span>{t(ROW_LABEL_KEYS[row.id])}</span>
            </div>
            <div className="guide-comparison-metric-values">
              {(["a", "b"] as const).map((releaseId, releaseIdx) => (
                <div
                  key={releaseId}
                  className={cn(
                    "guide-comparison-metric-value",
                    row.highlight === releaseIdx && "is-highlight",
                  )}
                >
                  <span className="guide-comparison-metric-value-label">
                    {t(`guide.comparison.release.${releaseId}`)}
                  </span>
                  {t(`guide.comparison.val.${row.id}.${releaseId}`)}
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="guide-comparison-footer">{t("guide.comparison.footer")}</p>
      </div>
    </div>
  );
}
