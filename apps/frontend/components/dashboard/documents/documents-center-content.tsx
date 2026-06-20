"use client";

import * as React from "react";

import { ProfileSectionSkeleton } from "@/components/dashboard/profile/profile-section-skeleton";
import { DashboardAppShell } from "@/components/layout/dashboard-app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/i18n/formatters";
import { formatApiError } from "@/lib/i18n/format-api-error";
import { getPublicApiBaseUrl, isLiveAccountEnabled } from "@/lib/public-env";
import {
  DOCUMENTS_API_PATHS,
  downloadUserDocument,
  isDocumentReady,
  saveBlob,
  type UserDocument,
} from "@/services/documents.service";

function documentKindLabel(kind: string, t: (key: string) => string): string {
  const key = `documents.kind.${kind}`;
  const translated = t(key);
  return translated === key ? kind : translated;
}

export function DocumentsCenterContent() {
  const { accessToken, authorizedFetch, isAuthenticated } = useAuth();
  const { locale, t } = useI18n();
  const live = isLiveAccountEnabled() && isAuthenticated;
  const [items, setItems] = React.useState<UserDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!live || !accessToken) {
      setLoading(false);
      return;
    }
    setError(null);
    void fetch(`${getPublicApiBaseUrl()}${DOCUMENTS_API_PATHS.list}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw body;
        }
        return r.json();
      })
      .then((body: { items?: UserDocument[] }) => setItems(body.items ?? []))
      .catch((e) => setError(formatApiError(e, locale) || t("documents.loadError")))
      .finally(() => setLoading(false));
  }, [accessToken, live, locale, t]);

  async function handleDownload(id: string) {
    if (!live) return;
    setDownloadingId(id);
    try {
      const file = await downloadUserDocument(id, authorizedFetch);
      saveBlob(file.blob, file.filename);
    } catch (e) {
      setError(formatApiError(e, locale) || t("documents.downloadError"));
    } finally {
      setDownloadingId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <DashboardAppShell contentClassName="max-w-3xl">
        <p className="text-sm text-neutral-600">{t("documents.signInRequired")}</p>
      </DashboardAppShell>
    );
  }

  if (!live) {
    return (
      <DashboardAppShell contentClassName="max-w-3xl">
        <p className="text-sm text-amber-800">{t("documents.liveRequired")}</p>
      </DashboardAppShell>
    );
  }

  return (
    <DashboardAppShell contentClassName="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("documents.page.title")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("documents.page.subtitle")}</p>
      </div>

      {loading ? <ProfileSectionSkeleton variant="list" rows={4} /> : null}
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
          {t("documents.empty")}
        </p>
      ) : null}

      <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
        {items.map((doc) => (
          <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-neutral-900">{documentKindLabel(doc.kind, t)}</p>
              <p className="text-xs text-neutral-500">
                {formatDate(doc.createdAt, locale)} · {doc.status}
              </p>
            </div>
            {isDocumentReady(doc.status) ? (
              <button
                type="button"
                disabled={downloadingId === doc.id}
                onClick={() => void handleDownload(doc.id)}
                className="shrink-0 text-sm font-medium text-neutral-800 underline disabled:opacity-50"
              >
                {downloadingId === doc.id ? t("documents.downloading") : t("documents.download")}
              </button>
            ) : (
              <span className="shrink-0 text-xs text-neutral-400">{doc.status}</span>
            )}
          </li>
        ))}
      </ul>
    </DashboardAppShell>
  );
}
