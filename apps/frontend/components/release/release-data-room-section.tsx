"use client";

import * as React from "react";

import { resolveApiUrl } from "@/lib/public-env";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";

type DataRoomDoc = {
  id: string;
  title: string;
  docType: string;
  visibility: string;
  locked: boolean;
  url: string | null;
};

export function ReleaseDataRoomSection({ releaseId }: { releaseId: string }) {
  const { accessToken } = useAuth();
  const { locale } = useI18n();
  const [items, setItems] = React.useState<DataRoomDoc[]>([]);

  React.useEffect(() => {
    const headers: HeadersInit = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    void fetch(resolveApiUrl(`/api/v1/releases/${releaseId}/data-room?locale=${locale}`), {
      credentials: "include",
      headers,
    })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((body: { items?: DataRoomDoc[] }) => setItems(body.items ?? []));
  }, [releaseId, accessToken, locale]);

  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-neutral-900">Data room</h2>
      <p className="mt-1 text-sm text-neutral-600">Документы и раскрытия по релизу.</p>
      <ul className="mt-4 divide-y divide-neutral-100">
        {items.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium text-neutral-900">{doc.title}</p>
              <p className="text-xs text-neutral-500">{doc.docType}</p>
            </div>
            {doc.locked ? (
              <span className="text-xs text-amber-700">Только для держателей</span>
            ) : doc.url ? (
              <a href={doc.url} className="text-sm font-medium underline" target="_blank" rel="noreferrer">
                Скачать
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
