"use client";

import * as React from "react";

import { resolveApiUrl } from "@/lib/public-env";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_DETAIL_ANALYTICS_ICONS } from "@/constants/analytics/release-detail-analytics-icons";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import { getWalletDataSource } from "@/services/wallet.service";

import { DetailEmptyState } from "./detail-empty-state";

type DataRoomDoc = {
  id: string;
  title: string;
  docType: string;
  visibility: string;
  locked: boolean;
  url: string | null;
};

function DataRoomSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  );
}

export function ReleaseDetailDataRoom({ releaseId }: { releaseId: string }) {
  const { accessToken } = useAuth();
  const { locale } = useI18n();
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);
  const live = getWalletDataSource() === "live";
  const [items, setItems] = React.useState<DataRoomDoc[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!live) {
      setLoaded(true);
      return;
    }
    const headers: HeadersInit = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    void fetch(resolveApiUrl(`/api/v1/releases/${releaseId}/data-room?locale=${locale}`), {
      credentials: "include",
      headers,
    })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((body: { items?: DataRoomDoc[] }) => {
        setItems(body.items ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [releaseId, accessToken, locale, live]);

  if (!live) return null;

  return (
    <section className="mt-10 rounded-2xl bg-[#0d0d0d] p-5 ring-1 ring-white/6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {t("analytics.detail.dataRoom.eyebrow")}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-white">{t("analytics.detail.dataRoom.title")}</h2>

      {!loaded ? (
        <>
          <p className="mt-2 text-sm text-zinc-500">{t("analytics.detail.dataRoom.loading")}</p>
          <DataRoomSkeleton />
        </>
      ) : items.length === 0 ? (
        <div className="mt-4 overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/6">
          <DetailEmptyState
            imageSrc={RELEASE_DETAIL_ANALYTICS_ICONS.dataRoomEmpty}
            title={t("analytics.detail.dataRoom.emptyTitle")}
            body={t("analytics.detail.dataRoom.emptyBody")}
          />
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-500">{t("analytics.detail.dataRoom.subtitle")}</p>
          <ul className="mt-4 divide-y divide-white/6">
            {items.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-white">{doc.title}</p>
                  <p className="text-xs text-zinc-500">{doc.docType}</p>
                </div>
                {doc.locked ? (
                  <span className="text-xs text-amber-400/90">{t("analytics.detail.dataRoom.holdersOnly")}</span>
                ) : doc.url ? (
                  <a
                    href={doc.url}
                    className="text-sm font-medium text-zinc-300 underline hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("analytics.detail.dataRoom.download")}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
