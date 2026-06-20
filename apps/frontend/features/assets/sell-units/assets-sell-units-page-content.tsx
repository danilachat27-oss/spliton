"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/data-states/empty-state";
import { ErrorState } from "@/components/shared/data-states/error-state";
import { AuthActionPanel } from "@/components/shared/auth-action-panel";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { AssetsSellUnitsScreen } from "@/features/assets/sell-units/assets-sell-units-screen";
import type { LinkedHoldingPreview } from "@/lib/assets/holdings";
import { getHoldingPreviewForCatalogReleaseId } from "@/lib/assets/holdings";
import { localizedApiError } from "@/lib/api/localized-error";
import { adaptPositionRow } from "@/lib/portfolio/portfolio-adapter";
import { fetchPortfolioPositions } from "@/services/portfolio.service";
import { fetchUserHoldings } from "@/services/secondary-market.service";
import { getWalletDataSource } from "@/services/wallet.service";
import type { MarketOverviewRow } from "@/types/market-overview";

type Props = {
  catalogId: string;
  row: MarketOverviewRow;
};

function matchHoldingFromPortfolio(
  catalogId: string,
  row: MarketOverviewRow,
  positions: ReturnType<typeof adaptPositionRow>[],
): LinkedHoldingPreview | null {
  const match = positions.find(
    (p) =>
      p.catalogReleaseId === catalogId ||
      p.catalogReleaseId === row.id ||
      p.id === catalogId,
  );
  if (!match?.heldUnits || match.heldUnits <= 0) return null;
  return {
    ...match,
    catalogReleaseId: match.catalogReleaseId ?? catalogId,
    heldUnits: match.heldUnits,
  };
}

export function AssetsSellUnitsPageContent({ catalogId, row }: Props) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const live = getWalletDataSource() === "live";
  const mockHolding = !live ? getHoldingPreviewForCatalogReleaseId(catalogId) : undefined;

  const [holding, setHolding] = useState<LinkedHoldingPreview | null>(mockHolding ?? null);
  const [loading, setLoading] = useState(live && isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!live) {
      setHolding(getHoldingPreviewForCatalogReleaseId(catalogId) ?? null);
      setNotFound(!getHoldingPreviewForCatalogReleaseId(catalogId));
      setError(null);
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setHolding(null);
      setLoading(false);
      setNotFound(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const [positionsRes, holdingsRes] = await Promise.all([
        fetchPortfolioPositions(authorizedFetch),
        fetchUserHoldings(authorizedFetch).catch(() => ({ items: [] })),
      ]);

      const positions = positionsRes.items.map((row) => adaptPositionRow(row, locale));
      let resolved = matchHoldingFromPortfolio(catalogId, row, positions);

      if (!resolved) {
        const marketMatch = holdingsRes.items.find(
          (h) =>
            h.releaseId === row.id ||
            h.symbol === row.symbol ||
            h.trackTitle === row.title,
        );
        if (marketMatch) {
          const available = Number.parseFloat(marketMatch.unitsAvailable);
          if (Number.isFinite(available) && available > 0) {
            resolved = {
              id: marketMatch.releaseId,
              catalogReleaseId: catalogId,
              heldUnits: available,
              release: marketMatch.trackTitle,
              artist: row.artist,
              genre: "Indie",
              units: marketMatch.unitsAvailable,
              status: "Active",
              share: "—",
              value: "—",
              dateEntered: "—",
            };
          }
        }
      }

      if (!resolved) {
        setHolding(null);
        setNotFound(true);
        return;
      }

      setHolding(resolved);
    } catch (e) {
      setError(localizedApiError(e));
      setHolding(null);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, catalogId, isAuthenticated, live, locale, row]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-10 pb-8 sm:space-y-12">
      {!live ? (
        <p className="text-xs text-neutral-500" role="status">
          {t("assets.demoPositionHint")}
        </p>
      ) : null}

      {live && !isAuthenticated ? (
        <AuthActionPanel
          title={t("auth.login.title")}
          description={t("wallet.loginGateSell")}
          ctaHref={ROUTES.login}
          ctaLabel={t("wallet.loginCta")}
          testId="sell-login-gate"
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-500">{t("assets.loadingPosition")}</p>
      ) : null}

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {notFound && !loading && !error ? (
        <div className="space-y-3">
          <EmptyState message={t("wallet.noUnitsToSell")} />
          <p className="text-center text-sm">
            <Link href={ROUTES.dashboardPositions} className="font-semibold text-neutral-800 underline">
              {t("assets.myPositions")}
            </Link>
            {" · "}
            <Link href={ROUTES.dashboardCatalog} className="font-semibold text-neutral-800 underline">
              {t("assets.catalog")}
            </Link>
          </p>
        </div>
      ) : null}

      {holding && !loading && !error ? (
        <AssetsSellUnitsScreen row={row} holding={holding} />
      ) : null}
    </div>
  );
}
