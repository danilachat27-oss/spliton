"use client";

import * as React from "react";
import { Plus, Trash2 } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminFieldInput, adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { AdminConfirmDialog, AdminLoadingState } from "@/features/admin/ui";
import {
  createAdminReleaseFaq,
  deleteAdminReleaseFaq,
  listAdminReleaseFaq,
  updateAdminReleaseFaq,
  type AdminReleaseFaqItem,
} from "@/services/admin/adminReleaseFaq.service";
import { cn } from "@/lib/utils";

type AdminReleaseFaqPanelProps = {
  releaseId: string | null;
  readOnly?: boolean;
};

export function AdminReleaseFaqPanel({ releaseId, readOnly = false }: AdminReleaseFaqPanelProps) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [items, setItems] = React.useState<AdminReleaseFaqItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState({ question: "", answer: "" });

  const load = React.useCallback(() => {
    if (!releaseId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    void listAdminReleaseFaq(releaseId, client)
      .then(setItems)
      .catch((e) => setError(localizedAdminError(e)))
      .finally(() => setLoading(false));
  }, [releaseId, client]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function addItem() {
    if (!releaseId || !draft.question.trim() || !draft.answer.trim()) return;
    setSaving(true);
    try {
      await createAdminReleaseFaq(
        releaseId,
        { question: draft.question.trim(), answer: draft.answer.trim(), isPublished: true, locale: "ru" },
        client,
      );
      setDraft({ question: "", answer: "" });
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: AdminReleaseFaqItem) {
    if (!releaseId || readOnly) return;
    try {
      await updateAdminReleaseFaq(releaseId, item.id, { isPublished: !item.isPublished }, client);
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  async function confirmDelete() {
    if (!releaseId || !deleteId) return;
    try {
      await deleteAdminReleaseFaq(releaseId, deleteId, client);
      setDeleteId(null);
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  if (!releaseId) {
    return (
      <p className="text-sm text-zinc-500">{a.t("admin.faq.saveReleaseFirst")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {loading ? <AdminLoadingState label={a.t("admin.faq.loading")} /> : null}
      {error ? <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p> : null}

      {!readOnly ? (
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <div>
            <Label htmlFor="faq-q">{a.t("admin.faq.question")}</Label>
            <Input
              id="faq-q"
              className={cn("mt-1", adminFieldInput)}
              value={draft.question}
              onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="faq-a">{a.t("admin.faq.answer")}</Label>
            <textarea
              id="faq-a"
              className={cn(
                "mt-1 min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2",
                adminFieldInput,
              )}
              value={draft.answer}
              onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
            disabled={saving}
            onClick={() => void addItem()}
          >
            <Plus className="mr-1 size-4" />
            {a.t("admin.faq.add")}
          </Button>
        </div>
      ) : null}

      <ul className="space-y-2">
        {items.length === 0 && !loading ? (
          <li className="text-sm text-zinc-500">{a.t("admin.faq.empty")}</li>
        ) : null}
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-zinc-100">{item.question}</p>
                <p className="mt-1 text-sm text-zinc-400">{item.answer}</p>
              </div>
              {!readOnly ? (
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={cn(adminBtnOutline, "h-8 border-zinc-700 text-xs")}
                    onClick={() => void togglePublished(item)}
                  >
                    {item.isPublished ? a.t("admin.faq.unpublish") : a.t("admin.faq.publish")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-red-400 hover:text-red-300"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={a.t("admin.faq.deleteTitle")}
        description={a.t("admin.faq.deleteDesc")}
        confirmLabel={a.t("admin.actions.confirm")}
        variant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
