"use client";

import * as React from "react";

import { LocaleFlag } from "@/components/i18n/locale-flag";
import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { AdminSectionPanel, AdminSectionRefreshButton } from "@/features/admin/components/admin-section-layout";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { LOCALE_OPTIONS, type AppLocale } from "@/lib/i18n/types";

type AnnouncementRow = {
  id: string;
  title: string;
  status: string;
  type: string;
  severity: string;
  audience: string;
  startsAt: string | null;
  endsAt: string | null;
};

type LocaleDraft = { title: string; message: string; shortMessage?: string };

const PRESETS = [
  {
    title: "Идут технические работы",
    message: "Платформа временно обслуживается. Некоторые операции могут выполняться с задержкой.",
    type: "maintenance",
    severity: "medium",
  },
  {
    title: "Пополнения временно недоступны",
    message: "Приём депозитов приостановлен оператором. Повторите позже.",
    type: "warning",
    severity: "high",
  },
  {
    title: "Выводы обрабатываются с задержкой",
    message: "Выводы проходят дополнительную проверку. Срок может быть увеличен.",
    type: "warning",
    severity: "medium",
  },
  {
    title: "Вторичный рынок временно ограничен",
    message: "Сделки на вторичном рынке Spliton приостановлены на время работ.",
    type: "incident",
    severity: "high",
  },
];

const LOCALE_TABS: AppLocale[] = ["ru", "en", "es", "pt"];

export function AdminSystemAnnouncementsPanel() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [items, setItems] = React.useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [activeLocaleTab, setActiveLocaleTab] = React.useState<AppLocale>("ru");
  const [drafts, setDrafts] = React.useState<Record<AppLocale, LocaleDraft>>({
    ru: { title: "", message: "" },
    en: { title: "", message: "" },
    es: { title: "", message: "" },
    pt: { title: "", message: "" },
  });
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    void client
      .get<{ items: AnnouncementRow[] }>(ADMIN_API_PATHS.systemAnnouncements)
      .then((res) => setItems(res.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client]);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateDraft = (locale: AppLocale, field: keyof LocaleDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  };

  const createDraft = React.useCallback(
    (preset?: (typeof PRESETS)[number]) => {
      const ruTitle = preset?.title ?? drafts.ru.title;
      const ruMessage = preset?.message ?? drafts.ru.message;
      if (!ruTitle.trim() || !ruMessage.trim()) return;

      void client
        .post(ADMIN_API_PATHS.systemAnnouncements, {
          title: ruTitle,
          message: ruMessage,
          shortMessage: drafts.ru.shortMessage ?? ruTitle,
          type: preset?.type ?? "info",
          severity: preset?.severity ?? "medium",
          audience: "all",
          showOnPublic: true,
          showInApp: true,
          showInAdmin: true,
          dismissible: true,
          sticky: preset?.type === "maintenance" || preset?.type === "incident",
          startsAt: startsAt || undefined,
          endsAt: endsAt || undefined,
          translations: {
            en: {
              title: drafts.en.title || ruTitle,
              message: drafts.en.message || ruMessage,
              shortMessage: drafts.en.shortMessage ?? drafts.en.title ?? ruTitle,
            },
            es: {
              title: drafts.es.title || ruTitle,
              message: drafts.es.message || ruMessage,
              shortMessage: drafts.es.shortMessage ?? drafts.es.title ?? ruTitle,
            },
            pt: {
              title: drafts.pt.title || ruTitle,
              message: drafts.pt.message || ruMessage,
              shortMessage: drafts.pt.shortMessage ?? drafts.pt.title ?? ruTitle,
            },
          },
        })
        .then(() => {
          setDrafts({
            ru: { title: "", message: "" },
            en: { title: "", message: "" },
            es: { title: "", message: "" },
            pt: { title: "", message: "" },
          });
          setMessage("Черновик создан");
          load();
        })
        .catch((e) => setMessage(e instanceof Error ? e.message : "Ошибка создания"));
    },
    [client, drafts, endsAt, load, startsAt],
  );

  const missingTranslationWarning =
    !drafts.en.title.trim() || !drafts.es.title.trim() || !drafts.pt.title.trim() ? (
      <p className="text-xs text-amber-800">
        TODO_TRANSLATION_REVIEW: для EN/ES/PT используется fallback на RU, если поля пустые.
      </p>
    ) : null;

  return (
    <AdminSectionPanel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Системные оповещения</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Баннеры для пользователей и админки: техработы, деградация сервисов, релизы. RU/EN/KA.
          </p>
        </div>
        <AdminSectionRefreshButton onClick={load} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.title}
            type="button"
            className="rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs hover:bg-zinc-900/50"
            onClick={() => createDraft(preset)}
          >
            <span className="font-semibold text-zinc-100">{preset.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {LOCALE_TABS.map((loc) => {
          const meta = LOCALE_OPTIONS.find((o) => o.code === loc);
          return (
            <button
              key={loc}
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                activeLocaleTab === loc
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-zinc-300"
              }`}
              onClick={() => setActiveLocaleTab(loc)}
            >
              <LocaleFlag locale={loc} size="sm" />
              {meta?.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          value={drafts[activeLocaleTab].title}
          onChange={(e) => updateDraft(activeLocaleTab, "title", e.target.value)}
          placeholder={`Заголовок (${activeLocaleTab.toUpperCase()})`}
          className="h-10 rounded-xl border border-neutral-200 px-3 text-sm"
        />
        <input
          value={drafts[activeLocaleTab].shortMessage ?? ""}
          onChange={(e) => updateDraft(activeLocaleTab, "shortMessage", e.target.value)}
          placeholder={`Короткий текст (${activeLocaleTab.toUpperCase()})`}
          className="h-10 rounded-xl border border-neutral-200 px-3 text-sm"
        />
        <textarea
          value={drafts[activeLocaleTab].message}
          onChange={(e) => updateDraft(activeLocaleTab, "message", e.target.value)}
          placeholder={`Сообщение (${activeLocaleTab.toUpperCase()})`}
          className="min-h-20 rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2"
        />
      </div>

      {missingTranslationWarning}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-400">
          Начало (optional)
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 block h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm"
          />
        </label>
        <label className="text-xs text-zinc-400">
          Окончание (optional)
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="mt-1 block h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => createDraft()}
          disabled={!drafts.ru.title.trim() || !drafts.ru.message.trim()}
        >
          Создать черновик
        </Button>
      </div>

      {message ? <p className="mt-2 text-xs text-zinc-400">{message}</p> : null}
      {loading ? <p className="mt-4 text-sm text-zinc-500">Загрузка…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">Не удалось загрузить оповещения.</p> : null}

      <ul className="mt-4 divide-y divide-neutral-100">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium text-zinc-100">{item.title}</p>
              <p className="text-xs text-zinc-500">
                {a.adminDomainLabel("announcement.status", item.status)} ·{" "}
                {a.adminDomainLabel("announcement.type", item.type)} ·{" "}
                {a.adminDomainLabel("announcement.severity", item.severity)} ·{" "}
                {a.adminDomainLabel("announcement.audience", item.audience)}
                {item.startsAt ? ` · с ${new Date(item.startsAt).toLocaleString("ru-RU")}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.status !== "active" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    void client.post(ADMIN_API_PATHS.systemAnnouncementPublish(item.id)).then(load)
                  }
                >
                  Опубликовать
                </Button>
              ) : null}
              {item.status !== "archived" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost" className={adminBtnOutline}
                  onClick={() =>
                    void client.post(ADMIN_API_PATHS.systemAnnouncementArchive(item.id)).then(load)
                  }
                >
                  Архив
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </AdminSectionPanel>
  );
}
