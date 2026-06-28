"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";

import { useI18n } from "@/components/providers/i18n-provider";
import {
  acceptLegalConsents,
  policyPublicHref,
  policyTypeLabel,
  type ConsentSource,
  type MissingConsentItem,
} from "@/services/legal.service";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  description: string;
  items: MissingConsentItem[];
  source: ConsentSource;
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>;
  onAccepted: () => void;
  onClose: () => void;
};

export function LegalConsentModal({
  open,
  title,
  description,
  items,
  source,
  authorizedFetch,
  onAccepted,
  onClose,
}: Props) {
  const { t } = useI18n();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || items.length === 0) return null;

  const handleAccept = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const policyIds = items.map((i) => i.policyId).filter((id): id is string => Boolean(id));
      if (policyIds.length === 0) return;
      await acceptLegalConsents(policyIds, source, authorizedFetch);
      setChecked(false);
      onAccepted();
    } catch {
      setError(t("compliance.modal.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        if (!next) onClose();
      }}
      modal
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[130] bg-black/50 backdrop-blur-[2px]",
            submitting && "pointer-events-none",
          )}
        />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-[131] max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          onKeyDown={(e) => {
            if (submitting && e.key === "Escape") e.preventDefault();
          }}
        >
          <Dialog.Title id="legal-consent-title" className="text-lg font-semibold text-zinc-950">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</Dialog.Description>
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">{t("compliance.modal.draftNotice")}</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-800">
            {items.map((item) => (
              <li key={item.policyId} className="flex items-start gap-2">
                <span className="mt-0.5 text-zinc-400">•</span>
                <span>
                  <Link
                    href={policyPublicHref(item.type)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-lime-700 underline-offset-2 hover:underline"
                  >
                    {item.title || policyTypeLabel(item.type, t)}
                  </Link>{" "}
                  <span className="text-zinc-500">(v{item.activeVersion})</span>
                </span>
              </li>
            ))}
          </ul>
          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-zinc-800">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-zinc-300"
              checked={checked}
              disabled={submitting}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>{t("compliance.modal.acceptCheckbox")}</span>
          </label>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!checked || submitting}
              onClick={() => void handleAccept()}
              className={cn(
                "rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {submitting ? t("compliance.modal.acceptSaving") : t("compliance.modal.acceptSubmit")}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 disabled:opacity-40"
            >
              {t("compliance.modal.cancel")}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
